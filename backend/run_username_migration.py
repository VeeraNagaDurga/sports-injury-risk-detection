"""
Runs migrate_add_username.sql against the database in your .env's
DATABASE_URL, using psycopg2 directly - same approach as run_migration.py.

Usage (from the backend/ folder, with your venv activated):
    python run_username_migration.py
"""
import os

from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Gvnd%402006@localhost:5432/sports_injury_db",
)

MIGRATION_FILE = "migrate_add_username.sql"

with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
    sql = f.read()

print("Connecting using DATABASE_URL from .env...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

print(f"Running {MIGRATION_FILE} ...")
cur.execute(sql)

print("Done. Current users table:")
cur.execute("SELECT id, email, username, role FROM users ORDER BY id;")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()

print(
    "\nNote: existing users were given placeholder usernames like 'user_12' "
    "since they signed up before this feature existed. If your app has (or "
    "will have) a 'choose your username' flow for already-registered users, "
    "point them to it - these placeholders work fine as real, valid, unique "
    "usernames in the meantime, they're just not personalized."
)