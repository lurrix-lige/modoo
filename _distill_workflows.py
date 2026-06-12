import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\Admin\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Get all sessions with real work (not auto-generated ones)
cursor.execute("""
    SELECT id, directory, title, time_created 
    FROM session 
    WHERE time_created > ?
      AND title NOT LIKE 'Auto %'
      AND title NOT LIKE 'New session%'
    ORDER BY time_created DESC
""", (cutoff_ms,))
sessions = cursor.fetchall()

print("=== WORK SESSIONS ===")
for s in sessions:
    sid = s[0]
    print(f"\nSession: {sid}")
    print(f"  Title: {s[2][:100] if s[2] else 'N/A'}")
    
    # Get tool call sequence
    cursor.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               json_extract(p.data, '$.state.input') as inp
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.session_id = ?
        ORDER BY m.time_created ASC
    """, (sid,))
    rows = cursor.fetchall()
    
    # Summarize tool sequence
    tool_seq = [r[0] for r in rows if r[0]]
    
    # Count tools
    from collections import Counter
    tool_counts = Counter(tool_seq)
    print(f"  Tools: {dict(tool_counts)}")
    
    # Find workflow phases (transitions between tool types)
    phases = []
    current_phase = tool_seq[0] if tool_seq else None
    phase_count = 1
    for t in tool_seq[1:]:
        if t != current_phase:
            phases.append((current_phase, phase_count))
            current_phase = t
            phase_count = 1
        else:
            phase_count += 1
    if current_phase:
        phases.append((current_phase, phase_count))
    
    # Show dominant phase transitions
    print(f"  Phases: {phases[:10]}")
    
    # Get unique files edited
    files_edited = set()
    for r in rows:
        if r[0] == 'Edit' and r[1]:
            try:
                d = json.loads(r[1])
                fp = d.get('file_path', '')
                if fp:
                    files_edited.add(fp.split('\\')[-1])
            except:
                pass
    if files_edited:
        print(f"  Files edited: {files_edited}")

# Analyze cross-session patterns
print("\n\n=== CROSS-SESSION WORKFLOW PATTERNS ===")

# Pattern 1: Type-check → Test → Git cycle
print("\n--- Type-check → Test → Git cycle ---")
cursor.execute("""
    SELECT m.session_id, 
           json_extract(p.data, '$.tool') as tool,
           json_extract(p.data, '$.state.input') as inp
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') IN ('Bash', 'Edit')
      AND m.time_created > ?
    ORDER BY m.session_id, m.time_created ASC
""", (cutoff_ms,))
all_rows = cursor.fetchall()

# Group by session and find tsc/test/git sequences
session_tools = {}
for r in all_rows:
    sid = r[0]
    tool = r[1]
    inp = r[2] or ''
    if sid not in session_tools:
        session_tools[sid] = []
    # Simplify bash commands
    if tool == 'Bash':
        try:
            d = json.loads(inp)
            cmd = d.get('command', '')
            if 'tsc' in cmd:
                session_tools[sid].append('tsc')
            elif 'vitest' in cmd or 'jest' in cmd:
                session_tools[sid].append('test')
            elif 'git status' in cmd:
                session_tools[sid].append('git-status')
            elif 'git diff' in cmd:
                session_tools[sid].append('git-diff')
            elif 'git log' in cmd:
                session_tools[sid].append('git-log')
            elif 'git commit' in cmd:
                session_tools[sid].append('git-commit')
            elif 'prettier' in cmd:
                session_tools[sid].append('prettier')
            else:
                session_tools[sid].append('bash-other')
        except:
            session_tools[sid].append('bash-raw')
    elif tool == 'Edit':
        session_tools[sid].append('edit')
    elif tool == 'Read':
        session_tools[sid].append('read')

# Find tsc → test → git sequences
for sid, tools in session_tools.items():
    # Find subsequences: tsc then test then git
    for i in range(len(tools)-2):
        triple = tuple(tools[i:i+3])
        if triple in [('tsc', 'test', 'git-status'), ('tsc', 'test', 'git-diff'),
                       ('edit', 'tsc', 'test'), ('edit', 'tsc', 'git-status'),
                       ('read', 'edit', 'tsc'), ('git-status', 'git-diff', 'git-commit')]:
            print(f"  [{sid[:20]}] {triple}")

# Pattern 2: Read → Edit → Verify cycle
print("\n--- Read → Edit → Verify cycles ---")
verify_tools = {'tsc', 'test', 'prettier'}
for sid, tools in session_tools.items():
    read_edit_verify = 0
    for i in range(len(tools)-2):
        if tools[i] == 'read' and tools[i+1] == 'edit' and tools[i+2] in verify_tools:
            read_edit_verify += 1
    if read_edit_verify >= 2:
        print(f"  [{sid[:20]}] {read_edit_verify}x read→edit→verify cycles")

# Pattern 3: Git commit workflow
print("\n--- Git commit workflows ---")
for sid, tools in session_tools.items():
    git_commits = tools.count('git-commit')
    if git_commits >= 1:
        # Find what precedes commits
        for i, t in enumerate(tools):
            if t == 'git-commit':
                preceding = tools[max(0,i-3):i]
                print(f"  [{sid[:20]}] commit preceded by: {preceding}")

conn.close()
