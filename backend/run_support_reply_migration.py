"""
Runs migrate_add_support_reply.sql against the database in your .env's
DATABASE_URL, using psycopg2 directly - same approach as
run_username_migration.py.

Usage (from the backend/ folder, with your venv activated):
    python run_support_reply_migration.py
"""
import os

from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Gvnd%402006@localhost:5432/sports_injury_db",
)

MIGRATION_FILE = "migrate_add_support_reply.sql"

with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
    sql = f.read()

print("Connecting using DATABASE_URL from .env...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

print(f"Running {MIGRATION_FILE} ...")
cur.execute(sql)

print("Done. Current support_messages table:")
cur.execute("SELECT id, subject, status, admin_reply, replied_at FROM support_messages ORDER BY id;")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()

print("\nAdmins can now reply to support tickets - the reply is stored and the sender is notified.")