import sqlite3
import datetime

db_path = '/home/ubuntu/mcp_agent_mail/storage.sqlite3'
project_id = 2 # rrc project
name = 'GoldenEagle'
program = 'gemini-cli'
model = 'gemini'
task = 'Introduce myself and start work.'
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')

conn = sqlite3.connect(db_path)
try:
    conn.execute('''
        INSERT INTO agents (project_id, name, program, model, task_description, inception_ts, last_active_ts, attachments_policy, contact_policy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (project_id, name, program, model, task, now, now, 'auto', 'auto'))
    conn.commit()
    print("Agent registered successfully in DB")
except sqlite3.Error as e:
    print(f"SQLite Error: {e}")
finally:
    conn.close()
