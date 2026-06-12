import sqlite3
import json
import os
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\Admin\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# 1. All sessions in last 30 days with their titles
print("=== SESSIONS (last 30 days) ===")
cursor.execute("""
    SELECT id, directory, title, time_created 
    FROM session 
    WHERE time_created > ?
    ORDER BY time_created DESC
""", (cutoff_ms,))
sessions = cursor.fetchall()
for s in sessions:
    print(f"\n  Session: {s[0]}")
    print(f"  Dir: {s[1]}")
    print(f"  Title: {s[2]}")
    print(f"  Time: {s[3]}")

# 2. Tasks per session
print("\n\n=== TASKS PER SESSION ===")
cursor.execute("""
    SELECT session_id, status, summary, created_at
    FROM task
    WHERE created_at > ?
    ORDER BY created_at DESC
""", (cutoff_ms,))
for row in cursor.fetchall():
    print(f"  [{row[0]}] status={row[1]} | {row[2][:120] if row[2] else 'N/A'}")

# 3. Repeated edit file paths (files edited 3+ times)
print("\n\n=== REPEATEDLY EDITED FILES ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'Edit'
      AND m.time_created > ?
    GROUP BY json_extract(p.data, '$.state.input')
    HAVING n >= 3
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = row[0]
    try:
        d = json.loads(inp)
        fp = d.get('file_path', 'unknown')
    except:
        fp = str(inp)[:100]
    print(f"  {fp}: {row[1]} edits")

# 4. Repeated bash command patterns (commands run 2+ times)
print("\n\n=== REPEATED BASH COMMANDS ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'Bash'
      AND m.time_created > ?
    GROUP BY json_extract(p.data, '$.state.input')
    HAVING n >= 2
    ORDER BY n DESC
    LIMIT 30
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = row[0]
    try:
        d = json.loads(inp)
        cmd = d.get('command', 'unknown')
    except:
        cmd = str(inp)[:100]
    print(f"  (x{row[1]}) {cmd}")

# 5. Sequence of tool calls per session (to detect workflows)
print("\n\n=== TOOL CALL SEQUENCES (sample per session, max 5 sessions) ===")
for s in sessions[:5]:
    sid = s[0]
    cursor.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               json_extract(p.data, '$.state.input') as inp
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.session_id = ?
        ORDER BY m.time_created ASC
        LIMIT 80
    """, (sid,))
    rows = cursor.fetchall()
    print(f"\n  Session: {sid} ({s[2][:60]})")
    print(f"  Total tool calls: {len(rows)}")
    # Summarize tool sequence
    tools = []
    for r in rows:
        tool = r[0]
        if tool:
            tools.append(tool)
    # Find repeated subsequences
    from collections import Counter
    # Look at tool patterns (batches of 3)
    triples = [tuple(tools[i:i+3]) for i in range(len(tools)-2)]
    triple_counts = Counter(triples)
    common_triples = triple_counts.most_common(5)
    if common_triples:
        print(f"  Common tool triples:")
        for tc in common_triples:
            print(f"    {tc[0]}: x{tc[1]}")

# 6. User requests / intents (first user message per session)
print("\n\n=== USER INTENTS (first user message per session) ===")
for s in sessions[:10]:
    sid = s[0]
    cursor.execute("""
        SELECT json_extract(data, '$.content') as content
        FROM message
        WHERE session_id = ? AND json_extract(data, '$.role') = 'user'
        ORDER BY time_created ASC
        LIMIT 1
    """, (sid,))
    row = cursor.fetchone()
    if row and row[0]:
        content = row[0][:300]
        print(f"\n  [{sid}] {content}")

conn.close()
