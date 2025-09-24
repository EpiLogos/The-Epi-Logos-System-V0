#!/usr/bin/env python3
"""
One-time script to set up the initial admin user.
This script will promote the first user account to admin status.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.database.mongodb_client import MongoDBClient


async def setup_initial_admin():
    """Set up the initial admin user."""
    try:
        # Initialize MongoDB client
        mongo_client = MongoDBClient()
        await mongo_client.connect()
        
        collection = mongo_client.get_collection("users")
        
        # Check if any admin users already exist
        admin_count = collection.count_documents({"isAdmin": True})
        if admin_count > 0:
            print(f"✅ Admin users already exist ({admin_count} found). No action needed.")
            return True
        
        # Find the first user (oldest by creation date)
        first_user = collection.find_one({}, sort=[("createdAt", 1)])
        
        if not first_user:
            print("❌ No users found in the database. Please create a user account first.")
            return False
        
        email = first_user.get("email", "Unknown")
        user_id = first_user.get("_id")
        
        # Promote first user to admin
        result = collection.update_one(
            {"_id": user_id},
            {"$set": {"isAdmin": True}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Successfully promoted first user '{email}' to admin status.")
            print("🎉 Initial admin setup complete!")
            return True
        else:
            print(f"❌ Failed to promote user '{email}' to admin status.")
            return False
            
    except Exception as e:
        print(f"❌ Error setting up initial admin: {e}")
        return False
    finally:
        await mongo_client.close()


def main():
    """Main function."""
    print("🚀 Setting up initial admin user...")
    print("-" * 40)
    
    success = asyncio.run(setup_initial_admin())
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
