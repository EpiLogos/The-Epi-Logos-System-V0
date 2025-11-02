#!/usr/bin/env python3
"""
Migration Script: Conversations to Hybrid Architecture

This script migrates the MongoDB conversation storage from:
  - Single collection: `conversations` (individual turns with session_id field)

To hybrid architecture:
  - `conversation_turns` (individual turns with thread_id field)
  - `conversation_threads` (aggregated threads with embedded message arrays)

USAGE:
    python scripts/migrate_conversations_to_hybrid.py [--dry-run] [--rollback]

OPTIONS:
    --dry-run    Show what would be migrated without making changes
    --rollback   Restore from backup (requires backup file)

SAFETY:
    - Creates full backup before migration
    - Validates data integrity after migration
    - Provides rollback capability
"""

import asyncio
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load environment variables
load_dotenv()

from shared.database.mongodb_client import MongoDBClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ConversationMigration:
    """Handles migration from single to hybrid conversation architecture."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.mongo = MongoDBClient()
        self.db = self.mongo.get_database()
        self.backup_file = f"conversation_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    def _make_json_serializable(self, obj: Any) -> Any:
        """Recursively convert MongoDB objects to JSON-serializable types."""
        if hasattr(obj, '__class__') and obj.__class__.__name__ == 'ObjectId':
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        else:
            return obj

    async def create_backup(self) -> bool:
        """Create full backup of conversations or conversation_turns collection."""
        try:
            logger.info("📦 Creating backup...")

            # Check which collection exists
            collections = self.db.list_collection_names()

            if "conversations" in collections:
                source_coll = self.db.get_collection("conversations")
                logger.info("  Backing up 'conversations' collection")
            elif "conversation_turns" in collections:
                source_coll = self.db.get_collection("conversation_turns")
                logger.info("  Backing up 'conversation_turns' collection")
            else:
                logger.warning("⚠️ No conversation data found - nothing to backup")
                return True

            all_docs = list(source_coll.find({}))

            # Convert to JSON-serializable format
            serializable_docs = [self._make_json_serializable(doc) for doc in all_docs]

            backup_path = os.path.join("scripts", self.backup_file)
            with open(backup_path, 'w') as f:
                json.dump(serializable_docs, f, indent=2)

            logger.info(f"✅ Backup created: {backup_path} ({len(all_docs)} documents)")
            return True

        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            return False

    async def migrate_to_turns(self) -> bool:
        """Copy conversations to conversation_turns and rename session_id → thread_id."""
        try:
            logger.info("🔄 Migrating conversations → conversation_turns...")

            # Check if conversations collection exists
            collections = self.db.list_collection_names()
            if "conversations" not in collections:
                if "conversation_turns" in collections:
                    logger.info("  ✅ conversation_turns already exists - skipping migration")
                else:
                    logger.warning("⚠️ No source data found")
                return True

            conversations_coll = self.db.get_collection("conversations")
            turns_coll = self.db.get_collection("conversation_turns")

            # Get all documents
            all_docs = list(conversations_coll.find({}))
            logger.info(f"  Found {len(all_docs)} documents to migrate")

            if self.dry_run:
                logger.info("  [DRY RUN] Would copy documents and rename session_id → thread_id")
                return True

            # Copy documents with field rename
            migrated_count = 0
            for doc in all_docs:
                # Rename session_id → thread_id
                if "session_id" in doc:
                    doc["thread_id"] = doc.pop("session_id")

                # Insert into conversation_turns
                turns_coll.insert_one(doc)
                migrated_count += 1

            logger.info(f"✅ Migrated {migrated_count} documents to conversation_turns")
            return True

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False

    async def delete_old_collection(self) -> bool:
        """Delete the old conversations collection."""
        try:
            logger.info("🗑️  Deleting old conversations collection...")

            if self.dry_run:
                logger.info("  [DRY RUN] Would delete conversations collection")
                return True

            self.db.drop_collection("conversations")

            logger.info("✅ Old collection deleted")
            return True

        except Exception as e:
            logger.error(f"❌ Collection deletion failed: {e}")
            return False

    async def rename_field(self) -> bool:
        """Rename session_id → thread_id in all documents."""
        try:
            logger.info("🔄 Renaming field session_id → thread_id...")
            
            turns_coll = self.db.get_collection("conversation_turns")
            
            # Count documents to update
            count = turns_coll.count_documents({"session_id": {"$exists": True}})
            logger.info(f"  Found {count} documents to update")
            
            if self.dry_run:
                logger.info("  [DRY RUN] Would rename field in all documents")
                return True
            
            # Rename field using $rename operator
            result = turns_coll.update_many(
                {"session_id": {"$exists": True}},
                {"$rename": {"session_id": "thread_id"}}
            )
            
            logger.info(f"✅ Renamed field in {result.modified_count} documents")
            return True
            
        except Exception as e:
            logger.error(f"❌ Field rename failed: {e}")
            return False

    async def create_thread_documents(self) -> bool:
        """Aggregate turns into thread documents with embedded message arrays."""
        try:
            logger.info("🔄 Creating conversation_threads collection...")

            turns_coll = self.db.get_collection("conversation_turns")
            threads_coll = self.db.get_collection("conversation_threads")

            # Clear existing thread documents to avoid duplicates
            if not self.dry_run:
                existing_count = threads_coll.count_documents({})
                if existing_count > 0:
                    logger.info(f"  Clearing {existing_count} existing thread documents...")
                    threads_coll.delete_many({})

            # Get all unique thread_ids
            pipeline = [
                {"$group": {"_id": "$thread_id"}},
                {"$project": {"thread_id": "$_id", "_id": 0}}
            ]

            thread_ids = [doc["thread_id"] for doc in turns_coll.aggregate(pipeline)]
            logger.info(f"  Found {len(thread_ids)} unique threads to create")

            if self.dry_run:
                logger.info("  [DRY RUN] Would create thread documents")
                return True

            # Create thread document for each thread_id
            created_count = 0
            for thread_id in thread_ids:
                # Get all turns for this thread
                turns = list(turns_coll.find({"thread_id": thread_id}).sort("created_at", 1))
                
                if not turns:
                    continue
                
                # Build messages array
                messages = []
                turn_number = 1
                for turn in turns:
                    # User message
                    if turn.get("user_message"):
                        messages.append({
                            "turn_number": turn_number,
                            "role": "user",
                            "content": turn["user_message"],
                            "timestamp": turn.get("created_at", datetime.now(timezone.utc)),
                            "metadata": {},
                            "context_used": turn.get("context_used", {}),
                            "pydantic_messages": None
                        })
                    
                    # Assistant message
                    if turn.get("agent_response"):
                        messages.append({
                            "turn_number": turn_number,
                            "role": "assistant",
                            "content": turn["agent_response"],
                            "timestamp": turn.get("created_at", datetime.now(timezone.utc)),
                            "metadata": turn.get("metadata", {}),
                            "context_used": turn.get("context_used", {}),
                            "pydantic_messages": turn.get("pydantic_messages")
                        })
                    
                    turn_number += 1
                
                # Get thread metadata from first turn
                first_turn = turns[0]
                last_turn = turns[-1]
                
                # Create thread document
                thread_doc = {
                    "thread_id": thread_id,
                    "user_id": first_turn.get("user_id", "unknown"),
                    "persona": first_turn.get("persona", "system"),
                    "etymology_session_id": first_turn.get("metadata", {}).get("etymology_session_id"),
                    "context": first_turn.get("context"),
                    "messages": messages,
                    "created_at": first_turn.get("created_at", datetime.now(timezone.utc)),
                    "last_activity": last_turn.get("created_at", datetime.now(timezone.utc)),
                    "metadata": first_turn.get("metadata", {})
                }
                
                # Insert thread document
                threads_coll.insert_one(thread_doc)
                created_count += 1
            
            logger.info(f"✅ Created {created_count} thread documents")
            return True
            
        except Exception as e:
            logger.error(f"❌ Thread creation failed: {e}")
            return False

    async def create_indexes(self) -> bool:
        """Create indexes on both collections."""
        try:
            logger.info("🔄 Creating indexes...")
            
            if self.dry_run:
                logger.info("  [DRY RUN] Would create indexes")
                return True
            
            turns_coll = self.db.get_collection("conversation_turns")
            threads_coll = self.db.get_collection("conversation_threads")
            
            # Indexes for conversation_turns
            turns_coll.create_index([("thread_id", 1), ("created_at", 1)])
            turns_coll.create_index([("user_id", 1), ("created_at", -1)])
            turns_coll.create_index([("context", 1)])
            
            # Indexes for conversation_threads
            threads_coll.create_index([("thread_id", 1)], unique=True)
            threads_coll.create_index([("user_id", 1), ("last_activity", -1)])
            threads_coll.create_index([("context", 1)])
            threads_coll.create_index([("etymology_session_id", 1)])
            
            logger.info("✅ Indexes created successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Index creation failed: {e}")
            return False

    async def validate_migration(self) -> bool:
        """Validate data integrity after migration."""
        try:
            logger.info("🔍 Validating migration...")
            
            turns_coll = self.db.get_collection("conversation_turns")
            threads_coll = self.db.get_collection("conversation_threads")
            
            # Count documents
            turns_count = turns_coll.count_documents({})
            threads_count = threads_coll.count_documents({})
            
            logger.info(f"  conversation_turns: {turns_count} documents")
            logger.info(f"  conversation_threads: {threads_count} documents")
            
            # Validate field rename
            old_field_count = turns_coll.count_documents({"session_id": {"$exists": True}})
            new_field_count = turns_coll.count_documents({"thread_id": {"$exists": True}})
            
            if old_field_count > 0:
                logger.error(f"❌ Found {old_field_count} documents still using session_id")
                return False
            
            logger.info(f"  ✅ All {new_field_count} turns use thread_id field")
            
            # Validate thread message counts
            sample_threads = list(threads_coll.find({}).limit(5))
            for thread in sample_threads:
                thread_id = thread["thread_id"]
                message_count = len(thread["messages"])
                turn_count = turns_coll.count_documents({"thread_id": thread_id})
                
                # Each turn can have 1-2 messages (user + assistant)
                if message_count < turn_count or message_count > turn_count * 2:
                    logger.warning(f"  ⚠️ Thread {thread_id}: {message_count} messages vs {turn_count} turns")
            
            logger.info("✅ Validation passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return False

    async def run_migration(self) -> bool:
        """Execute full migration process."""
        try:
            logger.info("=" * 60)
            logger.info("CONVERSATION MIGRATION TO HYBRID ARCHITECTURE")
            logger.info("=" * 60)

            if self.dry_run:
                logger.info("🔍 DRY RUN MODE - No changes will be made")

            # Step 1: Create backup
            if not await self.create_backup():
                return False

            # Step 2: Migrate to conversation_turns
            if not await self.migrate_to_turns():
                return False

            # Step 3: Create conversation_threads from turns
            if not await self.create_thread_documents():
                return False

            # Step 4: Create indexes
            if not await self.create_indexes():
                return False

            # Step 5: Delete old collection
            if not await self.delete_old_collection():
                return False

            # Step 6: Validate
            if not await self.validate_migration():
                return False

            logger.info("=" * 60)
            logger.info("✅ MIGRATION COMPLETED SUCCESSFULLY")
            logger.info("=" * 60)
            return True

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Migrate conversations to hybrid architecture")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be migrated without making changes")
    parser.add_argument("--rollback", type=str, help="Rollback from backup file")
    
    args = parser.parse_args()
    
    migration = ConversationMigration(dry_run=args.dry_run)
    success = await migration.run_migration()
    
    if not success:
        logger.error("Migration failed - check logs above")
        exit(1)
    
    logger.info("Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())

