"""
Runs migrate_add_is_active.sql against the database in your .env's
DATABASE_URL, using psycopg2 directly - no psql.exe needed.

Usage (from the backend/ folder, with your venv activated):
    python run_migration.py
"""
import os

from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Gvnd%402006@localhost:5432/sports_injury_db",
)

MIGRATION_FILE = "migrate_add_is_active.sql"

with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
    sql = f.read()

print(f"Connecting using DATABASE_URL from .env...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

print(f"Running {MIGRATION_FILE} ...")
cur.execute(sql)

print("Done. Current users table:")
cur.execute("SELECT id, email, role, is_active FROM users ORDER BY id;")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()