"""
Monkey-patch for Graphiti's Gemini client to handle markdown-wrapped JSON responses.

**Upstream Issue:**
Gemini LLM returns JSON wrapped in markdown code fences (```json...```),
but Graphiti's parser expects raw JSON, causing parse failures and retries.

**Solution:**
This patch intercepts Graphiti's JSON response parsing and strips markdown
code fences before JSON.loads() is called.

**Usage:**
Import this module anywhere in your application startup to apply the patch:
```python
from backend.epi_logos_system.cag.graphiti.gemini_patch import apply_gemini_patch
apply_gemini_patch()
```

**Risk Mitigation:**
- Try-except wrapper prevents crashes on Graphiti version changes
- Falls back to original behavior if patch fails
- Logs warnings for visibility

Created: 2025-10-27
"""

import re
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def apply_gemini_patch():
    """
    Apply monkey-patch for markdown-wrapped JSON by patching json.loads globally.

    This aggressive approach patches Python's json.loads to automatically strip
    markdown code fences. Works for all JSON parsing in the process.
    """
    try:
        import json as json_module

        # Check if already patched
        if hasattr(json_module, '_gemini_patch_applied'):
            logger.debug("JSON markdown patch already applied, skipping")
            return

        # Store original json.loads
        _original_loads = json_module.loads

        # Create patched json.loads
        def patched_loads(s, *args, **kwargs):
            """Patched json.loads that handles markdown-wrapped JSON."""
            if isinstance(s, str):
                # Try to strip markdown fences if present
                cleaned = _strip_markdown_fences(s)
                if cleaned != s:
                    logger.debug("Stripped markdown code fences from JSON string")
                    s = cleaned

            # Call original json.loads
            return _original_loads(s, *args, **kwargs)

        # Apply patch globally
        json_module.loads = patched_loads
        json_module._gemini_patch_applied = True

        logger.info("✅ Global JSON markdown fence patch applied")

    except Exception as e:
        logger.warning(f"Failed to apply JSON markdown patch (non-critical): {e}")


def _strip_markdown_fences(text: str) -> str:
    """
    Strip markdown code fences from text.

    Handles formats:
    - ```json\n{...}\n```
    - ```\n{...}\n```
    - ``` json\n{...}\n```

    Args:
        text: Raw text from Gemini

    Returns:
        Text with code fences removed
    """
    # Remove opening fence: ```json or ``` or ``` json
    text = re.sub(r'^```(?:json)?\s*\n?', '', text.strip(), flags=re.MULTILINE)

    # Remove closing fence: ```
    text = re.sub(r'\n?```\s*$', '', text.strip(), flags=re.MULTILINE)

    return text.strip()


# Auto-apply patch on import (optional - can also call explicitly)
# Commented out by default - uncomment if you want auto-patching on import
# apply_gemini_patch()
