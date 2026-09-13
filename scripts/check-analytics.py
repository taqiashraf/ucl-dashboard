"""Reconcile SQLite reporting results against the synthetic campaign ledger."""
import csv
import json
import sqlite3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
assets = json.loads((root / 'public/case-study/campaign.json').read_text())['assets']
db = sqlite3.connect(':memory:')
db.executescript((root / 'analytics/partner-report.sql').read_text())
columns = list(assets[0])
db.executemany(f'INSERT INTO asset_delivery ({",".join(columns)}) VALUES ({",".join("?" for _ in columns)})', [[r[k] for k in columns] for r in assets])
rows = list(db.execute('SELECT * FROM partner_recap ORDER BY partner'))
assert len(rows) == 2
assert abs(rows[0][2] - 19000/24000) < 1e-9
assert abs(rows[1][2] - 26000/31000) < 1e-9
assert sum(r[1] for r in rows) == 55000
assert sum(r[4] for r in rows) == 1380000
assert all(abs(r[-1] - .04) < 1e-9 for r in rows)
print('SQL reconciliation passed: two sample partners; fees, delivery and engagement match source records.')
with (root / 'public/case-study/asset-delivery.csv').open('w',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader();writer.writerows(assets)
