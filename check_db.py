import sqlite3

db = sqlite3.connect("AutoParts.db")

cursor = db.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
)

tables = cursor.fetchall()

print("Tables found:")

for table in tables:
    print(table[0])

db.close()