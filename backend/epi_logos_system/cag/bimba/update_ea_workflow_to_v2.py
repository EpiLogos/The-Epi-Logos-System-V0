"""
Script to update Etymology Archaeology workflow prompt to v2 with Graphiti enrichment awareness.

This script:
1. Loads EA_WORKFLOW_PROMPT_V2 from ea_workflow_init.py
2. Calls update_ea_workflow_version() to bump to v2
3. Invalidates Prakāśa cache for #5-4.5
4. Verifies the update

Run with: python3 -m backend.epi_logos_system.cag.bimba.update_ea_workflow_to_v2
"""

import asyncio
import logging
from shared.database.neo4j_client import Neo4jClient
from backend.epi_logos_system.cag.bimba.ea_workflow_init import (
    EA_WORKFLOW_PROMPT_V2,
    update_ea_workflow_version,
    get_active_ea_workflow_prompt
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Execute EA workflow v2 update."""
    logger.info("=" * 80)
    logger.info("EA WORKFLOW UPDATE TO V2: Graphiti Enrichment Awareness")
    logger.info("=" * 80)

    neo4j_client = Neo4jClient()

    try:
        # Step 1: Show current version
        logger.info("\nStep 1: Checking current EA workflow version...")
        current_prompt = await get_active_ea_workflow_prompt(neo4j_client)
        if current_prompt:
            logger.info(f"✓ Current prompt loaded ({len(current_prompt)} chars)")
        else:
            logger.warning("⚠ No current EA workflow prompt found - will create v2 as first version")

        # Step 2: Update to v2
        logger.info("\nStep 2: Updating to v2 with Graphiti enrichment awareness...")
        result = await update_ea_workflow_version(
            neo4j_client=neo4j_client,
            new_version="v2",
            new_prompt=EA_WORKFLOW_PROMPT_V2,
            changes_description=(
                "Added Graphiti enrichment tool awareness for depth accrual: "
                "enrich_community_properties, enrich_word_node, link_aphorism_to_community. "
                "Enhanced example flows showing property enrichment during conversation. "
                "Added Phase 5 (Depth accrual) to exploration phases."
            ),
            author="system"
        )

        if result.get("success"):
            logger.info(f"✓ Successfully updated to {result['new_version']}")
            logger.info(f"  Coordinate: {result['coordinate']}")
            logger.info(f"  Active version: {result['active_version']}")
        else:
            logger.error(f"✗ Update failed: {result.get('error')}")
            return

        # Step 3: Verify v2 loads correctly
        logger.info("\nStep 3: Verifying v2 prompt loads...")
        updated_prompt = await get_active_ea_workflow_prompt(neo4j_client)
        if updated_prompt and "Graphiti as Living Memory" in updated_prompt:
            logger.info(f"✓ V2 prompt verified ({len(updated_prompt)} chars)")
            logger.info("✓ Contains 'Graphiti as Living Memory' section")
        else:
            logger.error("✗ V2 prompt verification failed")
            return

        # Step 4: Cache invalidation notice
        logger.info("\nStep 4: Prakāśa cache invalidation...")
        logger.info("⚠ MANUAL ACTION REQUIRED:")
        logger.info("   Run: redis-cli DEL prakasa:identity:#5-4.5")
        logger.info("   Or restart agentic service to clear cache")

        logger.info("\n" + "=" * 80)
        logger.info("✓ EA WORKFLOW V2 UPDATE COMPLETE")
        logger.info("=" * 80)
        logger.info("\nNext EA sessions will use v2 prompt with Graphiti enrichment awareness.")
        logger.info("Enrichment tools (enrich_community_properties, enrich_word_node,")
        logger.info("link_aphorism_to_community) are now documented and ready for use.")

    except Exception as e:
        logger.error(f"Fatal error during update: {e}", exc_info=True)
    finally:
        await neo4j_client.close()
        logger.info("\nNeo4j connection closed.")


if __name__ == "__main__":
    asyncio.run(main())
