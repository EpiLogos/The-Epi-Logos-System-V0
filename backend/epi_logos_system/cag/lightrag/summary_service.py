"""
Document summarization service using Groq/Kimi K2 (fallback from Gemini 2.5 safety bug).

Generates lightweight document-level summaries with single async LLM call
for contextual grounding of chunk embeddings in coordinate-aware RAG.
"""

import logging
import os
from typing import Optional
from pydantic import BaseModel, Field

from backend.epi_logos_system.cag.lightrag.gemini_llm import get_gemini_service
from backend.epi_logos_system.cag.lightrag.groq_llm import get_groq_service

logger = logging.getLogger(__name__)


class DocumentSummary(BaseModel):
    """Document summary with coordinate context"""
    document_id: str = Field(..., description="Source document identifier")
    coordinate: str = Field(..., description="Bimba coordinate of document")
    summary_text: str = Field(..., description="Generated summary text")
    key_themes: list[str] = Field(default_factory=list, description="Extracted key themes")
    subsystem_context: Optional[str] = Field(None, description="Subsystem-specific context")


class DocumentSummaryService:
    """
    Generate document summaries using Groq/Kimi K2 (fallback from Gemini 2.5 safety bug).

    Async service for single LLM call per document to create lightweight
    summaries that provide contextual grounding for chunk embeddings.
    """

    def __init__(self):
        """Initialize with LLM service based on LIGHTRAG_LLM_MODEL env var"""
        llm_model = os.getenv("LIGHTRAG_LLM_MODEL", "gemini-2.5-flash")
        if llm_model.startswith("groq:"):
            self.llm_service = get_groq_service()
            logger.info("DocumentSummaryService initialized with Groq/Kimi K2")
        else:
            self.llm_service = get_gemini_service()
            logger.info("DocumentSummaryService initialized with Gemini Flash 2.5")

    async def generate_summary(
        self,
        document_content: str,
        document_id: str,
        coordinate: str,
        subsystem: Optional[int] = None
    ) -> DocumentSummary:
        """
        Generate document summary with coordinate context.

        Args:
            document_content: Full document text or first N chunks
            document_id: Unique document identifier
            coordinate: Bimba coordinate (e.g., "#4.2")
            subsystem: Subsystem number (0-5) for context

        Returns:
            DocumentSummary with generated text and extracted themes

        Raises:
            ValueError: If LLM call fails or returns invalid response
        """
        try:
            # Build coordinate-aware prompt
            prompt = self._build_summary_prompt(
                document_content=document_content,
                coordinate=coordinate,
                subsystem=subsystem
            )

            # Single async LLM call
            logger.info(f"Generating summary for document {document_id} at coordinate {coordinate}")

            response = await self.llm_service.complete(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for consistent summaries
                max_tokens=800    # Lightweight summary (~500-600 words)
            )

            if not response or not response.strip():
                raise ValueError("LLM returned empty summary")

            # Parse response (simple format: summary text followed by themes)
            summary_text, key_themes = self._parse_llm_response(response)

            # Add subsystem context if available
            subsystem_context = self._get_subsystem_context(subsystem) if subsystem is not None else None

            summary = DocumentSummary(
                document_id=document_id,
                coordinate=coordinate,
                summary_text=summary_text,
                key_themes=key_themes,
                subsystem_context=subsystem_context
            )

            logger.info(
                f"Summary generated: {len(summary_text)} chars, "
                f"{len(key_themes)} themes for {document_id}"
            )

            return summary

        except Exception as e:
            logger.error(f"Summary generation failed for {document_id}: {e}")
            raise ValueError(f"Failed to generate summary: {str(e)}") from e

    def _build_summary_prompt(
        self,
        document_content: str,
        coordinate: str,
        subsystem: Optional[int]
    ) -> str:
        """
        Build coordinate-aware summary prompt.

        Emphasizes coordinate context and key themes for RAG effectiveness.
        """
        subsystem_context = ""
        if subsystem is not None:
            subsystem_names = [
                "#0 Anuttara (Proto-logical Foundation)",
                "#1 Paramasiva (Quaternal Logic Engine)",
                "#2 Parashakti (Vibrational Processing)",
                "#3 Mahamaya (Symbolic Transcription)",
                "#4 Nara (Personal Interface)",
                "#5 Epii (Synthesis & Orchestration)"
            ]
            if 0 <= subsystem < len(subsystem_names):
                subsystem_context = f"\n\nThis document belongs to subsystem {subsystem_names[subsystem]}, which provides important context for its meaning and purpose."

        prompt = f"""You are summarizing a document in the Epi-Logos Bimba knowledge system at coordinate {coordinate}.{subsystem_context}

Create a concise summary (400-600 words) that:
1. Captures the main purpose and key concepts of this document
2. Emphasizes how it relates to the Bimba coordinate {coordinate}
3. Identifies 3-5 key themes or topics covered
4. Maintains awareness of the coordinate system context

Document content:
{document_content[:4000]}  # Limit to ~4000 chars for context window

Format your response as:
SUMMARY: [Your summary here]

KEY THEMES:
- [Theme 1]
- [Theme 2]
- [Theme 3]
"""

        return prompt

    def _parse_llm_response(self, response: str) -> tuple[str, list[str]]:
        """
        Parse LLM response into summary text and themes.

        Args:
            response: Raw LLM response

        Returns:
            Tuple of (summary_text, key_themes)
        """
        lines = response.strip().split('\n')

        summary_text = ""
        key_themes = []
        in_themes = False

        for line in lines:
            line = line.strip()

            if line.startswith("SUMMARY:"):
                summary_text = line.replace("SUMMARY:", "").strip()
            elif "SUMMARY:" in line and not summary_text:
                # Handle case where SUMMARY: is on separate line
                continue
            elif line.startswith("KEY THEMES:"):
                in_themes = True
            elif in_themes and line.startswith("-"):
                theme = line.lstrip("- ").strip()
                if theme:
                    key_themes.append(theme)
            elif not in_themes and not line.startswith("KEY THEMES:"):
                # Accumulate summary text before themes section
                if summary_text:
                    summary_text += " " + line
                elif line:  # First line of summary if no SUMMARY: prefix
                    summary_text = line

        # Fallback: use entire response as summary if parsing failed
        if not summary_text:
            summary_text = response.strip()

        return summary_text, key_themes

    def _get_subsystem_context(self, subsystem: int) -> str:
        """
        Get contextual description for subsystem.

        Args:
            subsystem: Subsystem number (0-5)

        Returns:
            Subsystem context string
        """
        subsystem_contexts = {
            0: "Proto-logical foundation and primordial ground",
            1: "Quaternal Logic engine and architectural patterns",
            2: "Vibrational processing and cosmic imagination",
            3: "Symbolic transcription and universal language",
            4: "Personal interface and dialogical processing",
            5: "Synthesis and orchestration processing"
        }
        return subsystem_contexts.get(subsystem, "")


# Global service instance
_summary_service = None


def get_summary_service() -> DocumentSummaryService:
    """Get or create DocumentSummaryService singleton"""
    global _summary_service
    if _summary_service is None:
        _summary_service = DocumentSummaryService()
    return _summary_service
