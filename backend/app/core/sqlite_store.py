import sqlite3
import json
import os
from datetime import datetime

# Store the DB file in the backend root directory
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "otp_store.db")

class PersistentOTPStore:
    def __init__(self):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS otps
                            (email TEXT PRIMARY KEY, otp TEXT, expires TEXT, data TEXT)''')
    
    def __setitem__(self, email: str, value: dict):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO otps (email, otp, expires, data) VALUES (?, ?, ?, ?)",
                (email, value['otp'], value['expires'].isoformat(), json.dumps(value['data']))
            )
            
    def get(self, email: str):
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("SELECT otp, expires, data FROM otps WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                return {
                    'otp': row[0],
                    'expires': datetime.fromisoformat(row[1]),
                    'data': json.loads(row[2])
                }
            return None
            
    def __delitem__(self, email: str):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM otps WHERE email = ?", (email,))
