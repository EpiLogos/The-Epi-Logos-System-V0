Phase 6 — Chat Thread History Sidebar (UI‑System)

Overview
- Add a thread history sidebar to the Chat modal in the new UI‑system.
- Threads represent individual conversations (AG‑UI thread_id). Do not conflate with higher‑level Redis sessions.
- Reuse existing AG‑UI flow and sessions API; add minimal endpoints for list/messages/delete to avoid overengineering.

Key Requirements
- Integrate into current Chat modal’s left panel, within its existing structure.
- Participate in content fade‑in transitions when entering chat modal state.
- Respect sidebar collapse/expand behavior via Sidebar context (responsive/hidden states, width changes).
- Display per‑user thread list with title, preview, timestamp, persona/model (if available).
- Actions: New Chat, Select Thread (reopen), Delete Thread.

Backend (Agentic) — Minimal Additions
Base: `http://localhost:8001/api/v1/sessions`

1) GET `/threads?user_id={id}&limit=50&page=1`
   - Returns array of thread summaries for a user.
   - Data source: Mongo ConversationManager grouped by session_id (which matches AG‑UI thread_id), enriched from Redis session payload when available.
   - Fields: `{ thread_id, title, last_message, created_at, last_activity, persona?, model? }`
   - Order: last_activity desc.

2) GET `/threads/{thread_id}/messages?limit=200`
   - Returns `{ messages: [{ role, content, created_at }] }` for the thread.
   - Implementation: ConversationManager.get_message_history(session_id=thread_id).

3) POST `/threads`
   - Body: `{ user_id, persona?, model? }`
   - Creates a new thread_id (UUID), creates Redis session payload (with thread_id), returns `{ thread_id, created_at }`.

4) DELETE `/threads/{thread_id}`
   - Clears conversation for thread (Mongo) and marks inactive/removes mapping in Redis.
   - Returns `{ deleted: true }`.

Notes
- Keep existing `GET /api/v1/sessions/{thread_id}` for mapping lookups (already used by frontend hook).
- AG‑UI streaming already uses `thread_id`; no change needed for run endpoint.

Frontend — Components & Hooks

Placement & Transitions
- Add a ThreadHistory panel inside the existing left sidebar content area of Chat modal.
- Ensure it renders inside the content container that participates in the modal’s content fade‑in state (leveraging ModalContentManager’s contentVisible and EpiLogos page animation phase flags).
- Consume Sidebar context (`useSidebar`) to adapt to collapsed state and widths (64px collapsed, 420px expanded). When collapsed, show compact icons or a minimal entry point (e.g., just a “+” New button and an indicator count).

Components
- `ThreadHistoryPanel`
  - Header: “Threads” (text-white), New Chat button (white border).
  - Optional search input (later iteration): filter titles/previews.
  - List: `ThreadItem` rows with active highlight.
  - Empty state: “No threads yet” + CTA.
  - Styling: `bg-black/30 border border-white/20 text-white`, active row `bg-white/5 border-white/40`.

Hook
- `useThreads`
  - State: `threads`, `activeThreadId`, `loading`, `error`.
  - Actions:
    - `loadThreads(userId)` — GET `/sessions/threads`.
    - `createThread()` — POST `/sessions/threads`, set active and focus chat input.
    - `selectThread(threadId)` — sets active and triggers chat hydration (see below).
    - `deleteThread(threadId)` — DELETE; if active, create a fresh one or display empty state.
  - Types: `ThreadSummary`, `ThreadMessagesResponse` mapped via domain helpers.

Chat Integration
- Extend `useChatIntegration` with `loadThread(threadId)`:
  - Set `session.threadId = threadId`.
  - GET `/sessions/threads/{thread_id}/messages` → map to `ChatMessage[]` and replace `session.messages`.
  - Subsequent `sendMessage()` continues streaming on same thread_id (already supported).
  - Maintain timings/spinner logic as implemented.

Sidebar Behavior Details
- Fade‑in: Wrap panel content with the same conditional classes used by ModalContentManager to participate in opacity/blur transitions.
- Collapse: Read `isCollapsed` from `useSidebar`.
  - Collapsed: reduce to icons or a compact pill with “Threads (n)” and a plus button; clicking expands or opens a popover.
  - Expanded: show full list with title/preview/timestamp.
- Height/overflow: when modal expanded, allow vertical scroll (existing Sidebar removes overflow‑hidden in that state).

Interaction Flow
1) On Chat modal open, load threads for current user (from unified auth context) and preselect the most recent.
2) Selecting a thread calls `loadThread(threadId)` and hydrates history; the right chat pane scrolls to bottom.
3) New Chat creates a fresh thread, clears right pane messages (bound to new thread_id), and focuses input.
4) Delete removes the thread; if it was active, start a new chat or select the next most recent.

API Integration Points
- Base endpoints pulled from `DEFAULT_ENDPOINTS.sessions` (existing domain).
- Add new URL builders in `domains/chat/api.domain.ts` for threads list/messages/create/delete.
- Keep all cross‑layer calls to Agentic service only; no direct DB connections from frontend.

Styling Tokens
- Borders: `border-white/20` (panels), `border-white/40` (active row).
- Text: `text-white` (primary), `text-white/70` (secondary), consistent with revised chat modal.
- Buttons: white borders, subtle hover states (no gray tokens).

Validation
- Manual: Create → send → appears at top; Select → loads history; Delete → correct fallback.
- Resilience: If threads list fails, show empty state with retry; chat still functions for ad‑hoc new thread generation.

Sequenced Tasks
1) Agentic endpoints: list/messages/create/delete under `agentic/api/sessions.py`.
2) Frontend domain: URL builders + types and `useThreads` hook.
3) UI: ThreadHistoryPanel with integration into Chat modal left sidebar container; respect fade‑in and collapse.
4) Hook up interactions: new/select/delete wired with chat hydration.
5) Polish: timestamps (relative), active highlighting, empty states.

Notes & Constraints
- Keep trilaminar boundaries: Frontend ↔ Agentic only; no Backend calls here.
- Maintain absolute imports from repo root.
- Tailwind v4: avoid pseudo in utility names; keep to repo conventions.

