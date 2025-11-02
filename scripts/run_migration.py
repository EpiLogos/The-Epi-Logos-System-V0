#!/usr/bin/env python3
"""
Migration Runner - Runs conversation migration through FastAPI/uvicorn context

This solves the Python 3.13 + MongoDB Atlas SSL issue by running the migration
in the same environment as the backend (which connects fine).

USAGE:
    # Dry run
    DRY_RUN=true python -m uvicorn scripts.run_migration:app --host 127.0.0.1 --port 9999
    
    # Actual migration
    python -m uvicorn scripts.run_migration:app --host 127.0.0.1 --port 9999
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from scripts.migrate_conversations_to_hybrid import ConversationMigration

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run migration on startup, then shutdown"""
    dry_run = os.getenv("DRY_RUN", "false").lower() == "true"
    
    logger.info("=" * 60)
    logger.info("MIGRATION RUNNER STARTING")
    logger.info("=" * 60)
    
    try:
        migration = ConversationMigration(dry_run=dry_run)
        success = await migration.run_migration()
        
        if success:
            logger.info("✅ Migration completed successfully!")
            logger.info("You can now stop this server (Ctrl+C)")
        else:
            logger.error("❌ Migration failed - check logs above")
            
    except Exception as e:
        logger.error(f"❌ Migration error: {e}", exc_info=True)
    
    yield
    
    logger.info("Shutting down migration runner...")


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {
        "message": "Migration runner - check console logs for migration status",
        "note": "This server runs the migration on startup. You can stop it after migration completes."
    }

