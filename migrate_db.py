import sqlite3

def run_migration():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE cases ADD COLUMN case_number TEXT;")
        conn.commit()
        print("Migrated successfully: column 'case_number' added to 'cases' table.")
    except sqlite3.OperationalError as oe:
        if "duplicate column name" in str(oe).lower():
            print("Migration skipped: column 'case_number' already exists.")
        else:
            print("Migration SQLite error:", oe)
    except Exception as e:
        print("Migration error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
