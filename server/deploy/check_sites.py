import sqlite3
c = sqlite3.connect("/www/server/panel/data/default.db").cursor()
c.execute("SELECT id,name,path FROM sites")
for r in c.fetchall():
    print(r)
c.execute("SELECT id,name,pid FROM domain")
for r in c.fetchall():
    print("domain:", r)
