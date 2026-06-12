import sqlite3
import json
import os
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\Admin\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. List tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("=== TABLES ===")
print(tables)

# 2. Schema for key tables
for tbl in ['session', 'message', 'part', 'task', 'task_event', 'actor_registry']:
    try:
        cursor.execute(f"PRAGMA table_info({tbl})")
        cols = [(r[1], r[2]) for r in cursor.fetchall()]
        print(f"\n=== {tbl} columns ===")
        print(cols)
    except:
        print(f"\n=== {tbl} === NOT FOUND")

# 3. Recent sessions (last 30 days)
cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
print(f"\n=== RECENT SESSIONS (since {cutoff_ms}) ===")
try:
    cursor.execute("""
        SELECT id, directory, title, time_created 
        FROM session 
        WHERE time_created > ?
        ORDER BY time_created DESC
    """, (cutoff_ms,))
    for row in cursor.fetchall():
        print(f"  {row[0]} | dir={row[1]} | title={row[2]} | time={row[3]}")
except Exception as e:
    print(f"Error: {e}")

# 4. Most used tools in recent sessions
print("\n=== TOP TOOL USAGE (last 30 days) ===")
try:
    cursor.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               count(*) as n
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.time_created > ?
        GROUP BY tool
        ORDER BY n DESC
        LIMIT 30
    """, (cutoff_ms,))
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
except Exception as e:
    print(f"Error: {e}")

# 5. Common tool input patterns (grouped by tool + first 100 chars of input)
print("\n=== COMMON TOOL INPUT PATTERNS ===")
try:
    cursor.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.state.input'), 1, 150) as input_preview,
               count(*) as n
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.time_created > ?
        GROUP BY tool, input_preview
        HAVING n >= 2
        ORDER BY n DESC
        LIMIT 40
    """, (cutoff_ms,))
    for row in cursor.fetchall():
        print(f"  [{row[0]}] (x{row[2]}): {row[1]}")
except Exception as e:
    print(f"Error: {e}")

# 6. User messages with repeated keywords
print("\n=== USER MESSAGES WITH REPEATED-WORKFLOW KEYWORDS ===")
keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 'like before', 'always do', '每次都', '重复', '按照上次', '一样']
for kw in keywords:
    try:
        cursor.execute("""
            SELECT m.id, substr(json_extract(m.data, '$.content'), 1, 200)
            FROM message m
            WHERE json_extract(m.data, '$.role') = 'user'
              AND json_extract(m.data, '$.content') LIKE ?
              AND m.time_created > ?
            LIMIT 5
        """, (f'%{kw}%', cutoff_ms))
        rows = cursor.fetchall()
        if rows:
            print(f"\n  Keyword '{kw}':")
            for row in rows:
                print(f"    [{row[0]}]: {row[1]}")
    except Exception as e:
        pass

# 7. Actor registry (subagent patterns)
print("\n=== ACTOR REGISTRY ===")
try:
    cursor.execute("SELECT * FROM actor_registry LIMIT 20")
    cols = [d[0] for d in cursor.description]
    for row in cursor.fetchall():
        print(f"  {dict(zip(cols, row))}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
