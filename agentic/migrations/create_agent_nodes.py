"""
Migration: Create Agent Nodes

Creates agent nodes #5-4.0 through #5-4.5 in the Bimba graph.

These nodes serve as the runtime manifestation of each subsystem,
storing f_system_prompt, f_workflow_prompts, and f_* capabilities.

Reference: /memory/sprint_tracking/sprint-3/active_sprint/prakasa-layered-architecture-refactor-plan.md

Usage:
    python -m agentic.migrations.create_agent_nodes
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from agentic.agents.agent_node_manager import AgentNodeManager

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


async def create_all_agent_nodes():
    """Create all 6 agent nodes in #5-4 branch."""
    logger.info("=== Agent Node Migration ===")
    logger.info("Creating agent nodes #5-4.0 through #5-4.5")

    # Initialize clients
    bimba_client = BimbaGraphQLClient()
    agent_node_manager = AgentNodeManager(bimba_client)

    results = []

    for subsystem in range(6):
        try:
            agent_coord = await agent_node_manager.ensure_agent_node_exists(subsystem)
            results.append({
                "subsystem": subsystem,
                "coordinate": agent_coord,
                "status": "created" if "created" in str(agent_coord) else "exists",
                "success": True
            })
            logger.info(f"✓ {agent_coord} - {agent_node_manager.SUBSYSTEM_NAMES[subsystem]}")
        except Exception as e:
            results.append({
                "subsystem": subsystem,
                "coordinate": f"#{subsystem}-4.{subsystem}",
                "status": "failed",
                "success": False,
                "error": str(e)
            })
            logger.error(f"✗ Failed to create agent node for subsystem {subsystem}: {e}")

    # Summary
    logger.info("")
    logger.info("=== Migration Summary ===")
    successful = sum(1 for r in results if r["success"])
    logger.info(f"Successful: {successful}/6")

    if successful < 6:
        logger.error("Some agent nodes failed to create:")
        for r in results:
            if not r["success"]:
                logger.error(f"  - {r['coordinate']}: {r.get('error', 'Unknown error')}")
        return False

    logger.info("All agent nodes created successfully!")
    return True


async def verify_agent_nodes():
    """Verify all agent nodes exist and have correct relationships."""
    logger.info("")
    logger.info("=== Verification ===")

    bimba_client = BimbaGraphQLClient()
    agent_node_manager = AgentNodeManager(bimba_client)

    all_verified = True

    for subsystem in range(6):
        agent_coord = agent_node_manager.get_agent_coordinate(subsystem)

        try:
            # Check node exists
            result = await bimba_client.get_node_details_complete(agent_coord)

            if not result or result.get("success") is False:
                logger.error(f"✗ {agent_coord} - Node not found")
                all_verified = False
                continue

            # Check properties
            node_name = result.get("name")
            node_subsystem = result.get("allProperties", {}).get("subsystem")

            if node_subsystem != subsystem:
                logger.error(
                    f"✗ {agent_coord} - Subsystem mismatch "
                    f"(expected {subsystem}, got {node_subsystem})"
                )
                all_verified = False
                continue

            logger.info(f"✓ {agent_coord} - {node_name} (subsystem {subsystem})")

        except Exception as e:
            logger.error(f"✗ {agent_coord} - Verification failed: {e}")
            all_verified = False

    logger.info("")
    if all_verified:
        logger.info("✓ All agent nodes verified successfully!")
    else:
        logger.error("✗ Some agent nodes failed verification")

    return all_verified


async def main():
    """Run migration."""
    try:
        # Create agent nodes
        creation_success = await create_all_agent_nodes()

        if not creation_success:
            logger.error("Migration failed during creation phase")
            sys.exit(1)

        # Verify creation
        verification_success = await verify_agent_nodes()

        if not verification_success:
            logger.error("Migration failed during verification phase")
            sys.exit(1)

        logger.info("")
        logger.info("=== Migration Complete ===")
        logger.info("Agent nodes #5-4.0 through #5-4.5 are ready for use")

    except Exception as e:
        logger.error(f"Migration failed with exception: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
