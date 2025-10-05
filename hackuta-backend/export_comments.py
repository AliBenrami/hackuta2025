"""
Export comments from the database to a JSON file.
This script reads all comments from the hackuta.db database and saves them to comments.json
"""
import sqlite3
import json
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "hackuta.db")
output_path = os.path.join(script_dir, "comments.json")

# Connect to the database
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row  # This enables column access by name
cursor = conn.cursor()

# Query all comments
cursor.execute("""
    SELECT 
        id,
        image_id,
        comment_id,
        text,
        author_id,
        author_username,
        created_at
    FROM comments
    ORDER BY created_at DESC
""")

# Fetch all rows and convert to list of dictionaries
comments = []
for row in cursor.fetchall():
    comment = {
        "id": row["id"],
        "image_id": row["image_id"],
        "comment_id": row["comment_id"],
        "text": row["text"],
        "author_id": row["author_id"],
        "author_username": row["author_username"],
        "created_at": row["created_at"]
    }
    comments.append(comment)

# Close the database connection
conn.close()

# Write to JSON file
with open(output_path, "w") as f:
    json.dump(comments, f, indent=2)

print(f"Successfully exported {len(comments)} comments to {output_path}")
