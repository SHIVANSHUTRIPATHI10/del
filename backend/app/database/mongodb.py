import os

from pymongo import MongoClient


MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017"
)

client = MongoClient(MONGO_URI)

db = client["ps7_database"]

sections_collection = db["sections"]
elements_collection = db["elements"]


def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully")
        return True

    except Exception as e:
        print("MongoDB connection failed:", e)
        return False