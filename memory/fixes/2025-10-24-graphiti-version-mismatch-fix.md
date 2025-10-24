# Graphiti Version Mismatch Fix - 2025-10-24

## Problem Summary

The Graphiti service was failing to start with the following error:

```
ModuleNotFoundError: No module named 'graphiti_core.llm_client.gemini_client'
```

## Root Cause

**Critical version mismatch** between requirements files:

1. **Main requirements** (`backend/requirements.txt`, `agentic/requirements.txt`):
   - Specified: `graphiti-core==0.3.6` (OLD VERSION)
   - This version **does not have Gemini support**
   - Only supports: OpenAI, Anthropic, Groq

2. **Graphiti subdirectory** (`backend/epi_logos_system/cag/graphiti/requirements.txt`):
   - Specified: `graphiti-core>=0.20.2` (CORRECT VERSION)
   - This version **has full Gemini support**

3. **Service code** (`backend/epi_logos_system/cag/graphiti/service.py`):
   - Expected Gemini modules that only exist in v0.20.2+
   - Tried to import:
     - `graphiti_core.llm_client.gemini_client`
     - `graphiti_core.embedder.gemini`
     - `graphiti_core.cross_encoder.gemini_reranker_client`

## What Changed in graphiti-core

### Version 0.3.6 (OLD - What we had)
- **LLM Clients**: OpenAI, Anthropic, Groq only
- **Embedders**: OpenAI only
- **Cross-encoders**: OpenAI only
- **Constructor**: `Graphiti(uri, user, password, llm_client=None)`

### Version 0.20.2+ (NEW - What we need)
- **LLM Clients**: OpenAI, Anthropic, Groq, **Gemini**
- **Embedders**: OpenAI, **Gemini**, Voyage
- **Cross-encoders**: OpenAI, **Gemini**
- **Constructor**: `Graphiti(uri, user, password, llm_client=None, embedder=None, cross_encoder=None, graph_driver=None, ...)`
- **New Features**:
  - Custom graph drivers (Neo4j, FalkorDB, Kuzu, Amazon Neptune)
  - Telemetry support (PostHog)
  - OpenTelemetry tracing
  - Better concurrency control

## Solution Applied

### 1. Updated Requirements Files

**backend/requirements.txt:**
```diff
- graphiti-core==0.3.6
+ graphiti-core>=0.20.2
```

**agentic/requirements.txt:**
```diff
- graphiti-core==0.3.6
+ graphiti-core>=0.20.2
```

### 2. Installed Updated Package

```bash
pip install --upgrade "graphiti-core[google-genai]>=0.20.2"
```

**Installed version:** `graphiti-core==0.22.0` (latest)

**New dependencies added:**
- `posthog>=3.0.0` (telemetry)
- `tenacity>=9.0.0` (upgraded from 8.5.0)
- `backoff>=1.10.0` (retry logic)

### 3. Verified Imports

All Gemini imports now work correctly:
```python
from graphiti_core.llm_client.gemini_client import GeminiClient, LLMConfig
from graphiti_core.embedder.gemini import GeminiEmbedder, GeminiEmbedderConfig
from graphiti_core.cross_encoder.gemini_reranker_client import GeminiRerankerClient
```

### 4. Verified Service Health

```bash
✅ GraphitiService import successful!
✅ GraphitiService instantiation successful!
✅ Health check result: {'status': 'healthy', 'neo4j_connection': True, ...}
```

## API Compatibility Notes

The existing service code in `backend/epi_logos_system/cag/graphiti/service.py` is **fully compatible** with the new version. The new Graphiti constructor accepts the same parameters we're using:

```python
self.graphiti = Graphiti(
    uri=neo4j_client.uri,
    user=neo4j_client.username,
    password=neo4j_client.password,
    llm_client=llm_client,        # ✅ Still supported
    embedder=embedder,             # ✅ New parameter (optional)
    cross_encoder=cross_encoder    # ✅ New parameter (optional)
)
```

## Environment Variable Note

The new version shows this message:
```
Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY.
```

This is informational only - the Gemini client accepts either environment variable.

## Testing Performed

1. ✅ Import verification - all Gemini modules import successfully
2. ✅ Config creation - LLMConfig and GeminiEmbedderConfig instantiate correctly
3. ✅ Service instantiation - GraphitiService creates without errors
4. ✅ Health check - endpoint returns healthy status with Neo4j connection

## Potential Breaking Changes to Watch For

While our code is compatible, be aware of these new features in v0.20.2+:

1. **Telemetry**: PostHog telemetry is now enabled by default
   - Can be disabled with `GRAPHITI_TELEMETRY_ENABLED=false`

2. **Concurrency**: New `max_coroutines` parameter for controlling parallelism
   - Default controlled by `SEMAPHORE_LIMIT` env var (default: 10)

3. **Graph Drivers**: Can now pass custom `graph_driver` instead of uri/user/password
   - Useful for FalkorDB, Kuzu, or Neptune backends

4. **Tracing**: OpenTelemetry support via `tracer` parameter

## Recommendations

1. **Monitor telemetry**: Review if we want to keep PostHog telemetry enabled
2. **Concurrency tuning**: Consider adjusting `SEMAPHORE_LIMIT` if we hit rate limits
3. **Version pinning**: Consider pinning to `graphiti-core==0.22.0` for stability
4. **Changelog review**: Check graphiti-core changelog for any other breaking changes

## Files Modified

- `backend/requirements.txt` - Updated graphiti-core version
- `agentic/requirements.txt` - Updated graphiti-core version
- `.venv/` - Upgraded packages via pip

## Related Documentation

- Graphiti GitHub: https://github.com/getzep/graphiti
- Graphiti Docs: https://help.getzep.com/graphiti
- Version 0.22.0 Release: https://github.com/getzep/graphiti/releases/tag/v0.22.0

