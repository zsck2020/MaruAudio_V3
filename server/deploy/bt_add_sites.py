import sqlite3
import time
import json

db_path = "/www/server/panel/data/default.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check existing sites
c.execute("SELECT id,name,path FROM sites")
existing = c.fetchall()
print("Existing sites:", existing)

existing_names = [r[1] for r in existing]

sites = [
    {"name": "ad-admin.wzagent.cn", "path": "/www/wwwroot/maruaudio/admin", "status": "1", "ps": "MaruAudio Admin Frontend", "type_id": 0},
    {"name": "ad-api.wzagent.cn", "path": "/www/wwwroot/maruaudio", "status": "1", "ps": "MaruAudio API", "type_id": 0},
]

for site in sites:
    if site["name"] in existing_names:
        print(f"Site {site['name']} already exists, skipping")
        continue
    
    now = int(time.time())
    c.execute(
        "INSERT INTO sites (name, path, status, ps, type_id, addtime, edate) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (site["name"], site["path"], site["status"], site["ps"], site["type_id"], str(now), "0000-00-00")
    )
    site_id = c.lastrowid
    print(f"Created site: {site['name']} (id={site_id})")
    
    # Add domain record
    c.execute(
        "INSERT INTO domain (pid, name, port, addtime) VALUES (?, ?, ?, ?)",
        (site_id, site["name"], 80, str(now))
    )
    print(f"  Added domain: {site['name']}")

conn.commit()
conn.close()
print("Done!")
