#!/usr/bin/env python3
"""
Script to promote a user to admin status.
Usage: python scripts/promote-admin.py <email>
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.database.mongodb_client import MongoDBClient
from backend.epi_logos_system.users.repositories.mongo_user_repository import MongoUserRepository


async def promote_user_to_admin(email: str):
    """Promote a user to admin status by email."""
    try:
        # Initialize MongoDB client and repository
        mongo_client = MongoDBClient()
        await mongo_client.connect()
        
        user_repository = MongoUserRepository(mongo_client)
        
        # Find user by email
        user = await user_repository.get_user_by_email(email)
        if not user:
            print(f"❌ User with email '{email}' not found.")
            return False
        
        # Check if already admin
        if user.isAdmin:
            print(f"✅ User '{email}' is already an admin.")
            return True
        
        # Update user to admin
        result = await user_repository.update_user(
            str(user.id), 
            {"isAdmin": True}
        )
        
        if result.modified_count > 0:
            print(f"✅ Successfully promoted '{email}' to admin status.")
            return True
        else:
            print(f"❌ Failed to promote '{email}' to admin status.")
            return False
            
    except Exception as e:
        print(f"❌ Error promoting user to admin: {e}")
        return False
    finally:
        await mongo_client.close()


async def list_admin_users():
    """List all current admin users."""
    try:
        # Initialize MongoDB client
        mongo_client = MongoDBClient()
        await mongo_client.connect()
        
        # Query for admin users
        collection = mongo_client.get_collection("users")
        admin_users = collection.find({"isAdmin": True})
        
        print("\n📋 Current Admin Users:")
        print("-" * 50)
        
        count = 0
        for user in admin_users:
            count += 1
            email = user.get("email", "Unknown")
            name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
            created = user.get("createdAt", "Unknown")
            
            print(f"{count}. {email}")
            if name:
                print(f"   Name: {name}")
            print(f"   Created: {created}")
            print()
        
        if count == 0:
            print("No admin users found.")
        else:
            print(f"Total admin users: {count}")
            
    except Exception as e:
        print(f"❌ Error listing admin users: {e}")
    finally:
        await mongo_client.close()


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/promote-admin.py <email>     # Promote user to admin")
        print("  python scripts/promote-admin.py --list     # List current admins")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        asyncio.run(list_admin_users())
    else:
        email = sys.argv[1]
        success = asyncio.run(promote_user_to_admin(email))
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
