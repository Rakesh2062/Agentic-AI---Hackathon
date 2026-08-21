import os
from dotenv import load_dotenv

# Load environment variables (to get your MongoDB Atlas URI)
load_dotenv()

from database.connection import get_sync_db
from database.collections import COLLECTIONS

def clear_database():
    print("Connecting to MongoDB to clear all collections...")
    db = get_sync_db()
    
    total_deleted = 0
    for collection_name in COLLECTIONS:
        print(f"Clearing collection: {collection_name}...")
        result = db[collection_name].delete_many({})
        print(f" - Deleted {result.deleted_count} documents.")
        total_deleted += result.deleted_count
        
    print(f"\n✅ Database cleared successfully! Total documents deleted: {total_deleted}")
    print("Your platform is now completely empty and ready for your real test cases tomorrow.")

if __name__ == "__main__":
    # Confirm before destructive action just to be safe
    response = input("Are you sure you want to delete ALL data in the database? (y/N): ")
    if response.lower() == 'y':
        clear_database()
    else:
        print("Operation cancelled.")
