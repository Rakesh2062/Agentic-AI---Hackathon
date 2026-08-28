"""
Helper script to reset or create Civic Official credentials in MongoDB.

Usage:
    cd Backend
    python reset_official.py
"""

import os
import sys
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import get_sync_db

def reset_official(
    official_id="OFF-7841",
    email="official@nagarsetu.gov.in",
    password="admin",
    name="Authorized Civic Official",
    department="Municipal Operations"
):
    try:
        db = get_sync_db()
        users_col = db["users"]
        now = datetime.now(timezone.utc)

        doc = {
            "name": name,
            "email": email.strip().lower(),
            "officialId": official_id.strip().upper(),
            "password": password,
            "role": "official",
            "department": department,
            "profilePhoto": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            "trustScore": 100,
            "memberSince": now.strftime("%Y-%m-%d"),
            "updated_at": now,
        }

        # Check if official exists
        existing = users_col.find_one({
            "$or": [
                {"officialId": official_id.strip().upper()},
                {"email": email.strip().lower()},
                {"role": "official"}
            ]
        })

        if existing:
            users_col.update_one({"_id": existing["_id"]}, {"$set": doc})
            print(f" Successfully updated Official account!")
        else:
            doc["created_at"] = now
            users_col.insert_one(doc)
            print(f" Successfully created new Official account!")

        print("--------------------------------------------------")
        print(f" Official ID : {doc['officialId']}")
        print(f" Email       : {doc['email']}")
        print(f" Password    : {doc['password']}")
        print(f" Department  : {doc['department']}")
        print("--------------------------------------------------")

    except Exception as e:
        print(f" Error connecting to MongoDB: {e}")
        print("\nNote: When MongoDB is offline, you can also sign in directly on the frontend using any Officer ID (e.g. OFF-7841) and your chosen password.")

if __name__ == "__main__":
    new_id = input("Enter Official ID (Press Enter for OFF-7841): ").strip() or "OFF-7841"
    new_email = input("Enter Official Email (Press Enter for official@nagarsetu.gov.in): ").strip() or "official@nagarsetu.gov.in"
    new_pass = input("Enter Official Password (Press Enter for admin123): ").strip() or "admin123"

    reset_official(official_id=new_id, email=new_email, password=new_pass)
