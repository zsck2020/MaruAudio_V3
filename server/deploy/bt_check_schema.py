import sqlite3
conn = sqlite3.connect("/www/server/panel/data/default.db")
c = conn.cursor()
c.execute("PRAGMA table_info(sites)")
print("=== sites columns ===")
for r in c.fetchall():
    print(r)
c.execute("PRAGMA table_info(domain)")
print("=== domain columns ===")
for r in c.fetchall():
    print(r)
c.execute("SELECT * FROM sites")
print("=== sites data ===")
for r in c.fetchall():
    print(r)
c.execute("SELECT * FROM domain")
print("=== domain data ===")
for r in c.fetchall():
    print(r)
conn.close()
