# Etymology Session Caching Analysis & Fix Plan

**Issue**: When creating communities in EA sessions, the backend can't find the Etymology Session despite being in an active thread within a session.

---

## Current Flow (What SHOULD Happen)

### Session Creation Flow:
1. **Frontend**: User clicks "New Session" in Atelier
2. **POST `/api/graphiti/etymology/sessions`**: Creates Etymology Session in MongoDB
   - Generates UUID for `session_id` (e.g., `a1b2c3d4-...`)
   - Stores in MongoDB `etymology_sessions` collection
   - **Caches in Redis** with key `ea:session:{session_id}` (24h TTL)
   - Returns `session_id`

3. **POST `/api/graphiti/etymology/sessions/{session_id}/threads?thread_id={thread_id}`**: Links thread to session
   - Adds `thread_id` to session's `thread_ids` array
   - Updates **both MongoDB and Redis** (write-through)
   - Thread ID format: `thread-d230bfdb-70f9-48f7-b10d-a32bff5319e5`

4. **POST `/api/conversations/sessions/{thread_id}/metadata`**: Sets Redis metadata
   - Stores `etymology_session_id` in thread metadata
   - Key: `session:{thread_id}:metadata`

### Community Creation Flow:
1. **Agent** calls `form_memory_community` tool
2. **Tool** passes `ctx.deps.session_id` (which is `thread_id`)
3. **POST `/api/graphiti/etymology/community`**: Creates community
4. **Backend** tries to link community to Etymology Session:
   - Receives `thread_id` as `request.session_id`
   - Needs to find which Etymology Session contains this `thread_id`
   - **CURRENT BUG**: Calls `get_session(thread_id)` instead of `get_session_by_thread_id(thread_id)`

---

## The Actual Problem

**ROOT CAUSE**: When the agent creates a community, it passes `thread_id`, but the backend was trying to look it up directly as a `session_id`.

**CACHING IS WORKING CORRECTLY** - the issue is the lookup logic, not the caching.

### Why Session Isn't Found:
1. Agent passes: `thread-d230bfdb-70f9-48f7-b10d-a32bff5319e5`
2. Backend tries: `get_session("thread-d230bfdb-70f9-48f7-b10d-a32bff5319e5")`
3. Redis key lookup: `ea:session:thread-d230bfdb-70f9-48f7-b10d-a32bff5319e5` ❌ WRONG
4. Actual Redis key: `ea:session:a1b2c3d4-...` (the UUID) ✅ CORRECT

**The session EXISTS in Redis** with the correct UUID key. We just need to look it up by `thread_id` instead of assuming `thread_id` IS the `session_id`.

---

## The Fix (Already Implemented)

### 1. Added `get_session_by_thread_id()` Method
**File**: `backend/epi_logos_system/cag/graphiti/session_service.py:187-224`

```python
async def get_session_by_thread_id(self, thread_id: str) -> Optional[EtymologySession]:
    """
    Get etymology session by thread ID.

    Looks up which session contains this thread_id in its thread_ids array.
    """
    # Query MongoDB for session containing this thread_id
    session_doc = self.collection.find_one({"thread_ids": thread_id})
    if not session_doc:
        logger.warning(f"No session found containing thread {thread_id}")
        return None

    # ... parse and cache in Redis for future lookups ...
    return session
```

**Why MongoDB Query?**
- We can't reverse-lookup from `thread_id` → `session_id` in Redis without storing a mapping
- MongoDB has the `thread_ids` array field we can query
- Once found, we cache the session in Redis using its actual `session_id`

### 2. Updated Community Creation Endpoint
**File**: `backend/epi_logos_system/cag/graphiti/api.py:391-423`

```python
if request.session_id and response.community:
    thread_id = request.session_id  # Actually a thread_id from agent

    # Look up which Etymology Session contains this thread_id
    existing_session = await session_service.get_session_by_thread_id(thread_id)

    if existing_session:
        # Update the actual session with its real UUID
        session_update = EtymologySessionUpdateRequest(
            session_id=existing_session.session_id,  # Use actual UUID
            communities_to_add=[community_id]
        )
        update_result = await session_service.update_session(session_update)
```

---

## Caching Architecture (Already Correct)

### Redis Keys:
```
ea:session:{session_uuid}           → Full Etymology Session object (24h TTL)
ea:user:{user_id}:sessions          → Set of session UUIDs for user (24h TTL)
session:{thread_id}:metadata        → Thread metadata including etymology_session_id
```

### Write-Through Pattern:
Every `update_session()` call:
1. Updates MongoDB document
2. Updates Redis cache simultaneously
3. Maintains cache freshness automatically

### Cache Invalidation:
- **TTL-based**: 24 hours (self-cleaning)
- **Manual**: Not needed with write-through pattern

---

## Testing the Fix

### Expected Logs (Success):
```
2025-10-29 17:50:09,252 - INFO - Created EA community entity d5ddfeb8-... with 3 words
2025-10-29 17:50:09,667 - INFO - Looking up Etymology Session for thread thread-d230bfdb-...
2025-10-29 17:50:09,755 - DEBUG - Session a1b2c3d4-... found by thread_id thread-d230bfdb-...
2025-10-29 17:50:09,850 - INFO - Found session a1b2c3d4-..., adding community d5ddfeb8-...
2025-10-29 17:50:10,115 - INFO - Successfully linked community d5ddfeb8-... to session a1b2c3d4-...
```

### Previous Logs (Failure):
```
2025-10-29 17:50:09,667 - INFO - Updating session thread-d230bfdb-... with community d5ddfeb8-...
2025-10-29 17:50:10,115 - WARNING - Session thread-d230bfdb-... not found
```

---

## Alternative Approaches Considered

### Option A: Store thread_id → session_id Mapping in Redis ❌
**Why Not:**
- Adds complexity (additional Redis keys to manage)
- Needs synchronization on every thread link
- TTL management for mappings
- MongoDB already has this data in `thread_ids` array

### Option B: Pass Both thread_id AND session_id from Agent ❌
**Why Not:**
- Agent doesn't have access to Etymology Session UUID
- Would require changing agent deps to include it
- Breaks separation of concerns (agent shouldn't know about EA session internals)

### Option C: Query MongoDB by thread_id (CHOSEN) ✅
**Why Yes:**
- MongoDB is source of truth
- One query to find session
- Session gets cached in Redis after first lookup
- Future updates hit Redis cache
- Clean separation of concerns

---

## Performance Considerations

### First Community Creation in Thread:
1. MongoDB query to find session by `thread_id` (~5-10ms)
2. Session cached in Redis for future operations
3. Community linked to session
4. **Total overhead**: ~10ms one-time cost

### Subsequent Community Creations:
1. MongoDB query finds session (~5-10ms)
2. `update_session()` hits Redis cache for read
3. Write-through updates both MongoDB and Redis
4. **Total overhead**: ~10ms per community (acceptable)

### Could We Optimize Further?
**Yes** - Store `thread_id → session_id` mapping in Redis on thread link:
```python
# In add_thread_to_session()
redis_client.setex(f"ea:thread:{thread_id}:session", 86400, session_id)
```

Then in community creation:
```python
# Fast Redis lookup first
session_id = redis_client.get(f"ea:thread:{thread_id}:session")
if session_id:
    session = await get_session(session_id)  # Hits Redis cache
else:
    session = await get_session_by_thread_id(thread_id)  # Fallback to MongoDB
```

**But**: Current implementation is fine. Optimize only if this becomes a bottleneck.

---

## Conclusion

**The caching is working correctly.** The issue was a **naming/lookup mismatch**:
- Agent passes `thread_id` (disguised as `session_id`)
- Backend was trying to look it up directly as an Etymology Session UUID
- Fix: Added `get_session_by_thread_id()` to find the actual session

**Next Step**: Restart backend and test community creation. Should now work seamlessly.
