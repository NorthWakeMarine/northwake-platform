#!/usr/bin/env python3
"""
Wipe all vessel records, re-seed from Customers.xls, then sync QB Notes.
Run from repo root: python3 scripts/reseed-vessels.py
"""

import json, time
import urllib.request, urllib.parse
import xlrd

SUPABASE_URL = "https://fizibmqghukibnbfotuf.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpemlibXFnaHVraWJuYmZvdHVmIiwicm9sZSI6"
    "InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0MjkwNSwiZXhwIjoyMDkyMDE4OTA1fQ."
    "3ENC9AzxLrv_qFHVrDrC3ZJudas3hgMH_jneUuCnTFc"
)
XLS_PATH = "/Users/ianwilliams/Desktop/Customers.xls"
QB_BASE  = "https://quickbooks.api.intuit.com/v3"

# ── Supabase helpers ──────────────────────────────────────────────────────────

def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def sb_get(path, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=sb_headers())
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def sb_post(path, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=sb_headers(), method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def sb_delete(path, params):
    url = f"{SUPABASE_URL}/rest/v1/{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=sb_headers(), method="DELETE")
    with urllib.request.urlopen(req) as r:
        return r.read()

# ── QB helpers ────────────────────────────────────────────────────────────────

def get_qb_tokens():
    rows = sb_get("oauth_tokens", {"provider": "eq.quickbooks", "select": "access_token,refresh_token,realm_id,expires_at"})
    return rows[0] if rows else None

def qb_request(tokens, method, path, body=None):
    sep = "&" if "?" in path else "?"
    url = f"{QB_BASE}/company/{tokens['realm_id']}{path}{sep}minorversion=70"
    data = json.dumps(body).encode() if body else None
    headers = {
        "Authorization": f"Bearer {tokens['access_token']}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  QB error {e.code}: {e.read().decode()[:200]}")
        return None

VESSELS_PREFIX = "Vessels:"

def build_notes_with_vessels(existing_notes, vessels):
    other = "\n".join(
        l for l in (existing_notes or "").split("\n")
        if not l.startswith(VESSELS_PREFIX)
    ).strip()
    if not vessels:
        return other
    parts = " | ".join(
        f"{v['year'] or ''} - {v['make_model'] or ''} - {v['length_ft'] or ''}"
        for v in vessels
    )
    line = f"{VESSELS_PREFIX} {parts}"
    return f"{line}\n{other}" if other else line

# ── XLS parsing ───────────────────────────────────────────────────────────────

def parse_vessel_cell(raw):
    """Parse 'YYYY - Make/Model - LenFt' or '- Make/Model - LenFt' into dict."""
    raw = raw.strip()
    if not raw:
        return None
    # Normalize leading "- " (no-year prefix) so split produces 3 clean parts
    if raw.startswith("- "):
        raw = " " + raw  # " - Make/Model - Length" -> splits cleanly
    parts = [p.strip() for p in raw.split(" - ")]
    year_str    = parts[0] if len(parts) > 0 else ""
    make_model  = parts[1] if len(parts) > 1 else None
    length_ft   = parts[2] if len(parts) > 2 else None

    try:
        year = int(year_str)
        year = year if year > 1900 else None
    except (ValueError, TypeError):
        year = None

    make_model = make_model or None
    length_ft  = (length_ft or "").strip() or None

    if not make_model:
        return None
    return {"year": year, "make_model": make_model, "length_ft": length_ft}

def load_xls():
    """Returns list of {name, email, phone, vessels:[...]}"""
    wb = xlrd.open_workbook(XLS_PATH)
    sheet = wb.sheets()[0]
    customers = []
    # Vessel columns: indices 9=(3), 10=(1), 11=(2), 12=(4)
    VESSEL_COLS = [10, 11, 9, 12]  # ordered (1),(2),(3),(4)
    for r in range(1, sheet.nrows):
        row = [str(sheet.cell_value(r, c)).strip() for c in range(sheet.ncols)]
        name  = row[0] or None
        phone = row[7] or None
        email = row[8] or None
        vessels = []
        for ci in VESSEL_COLS:
            v = parse_vessel_cell(row[ci] if ci < len(row) else "")
            if v:
                vessels.append(v)
        customers.append({"name": name, "email": email, "phone": phone, "vessels": vessels})
    return customers

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading Customers.xls...")
    customers = load_xls()
    print(f"  {len(customers)} customers, {sum(len(c['vessels']) for c in customers)} total vessels")

    print("\nFetching CRM contacts...")
    contacts = sb_get("contacts", {"select": "id,name,email,phone,qb_customer_id", "limit": "1000"})
    email_map = {c["email"].lower(): c for c in contacts if c.get("email")}
    name_map  = {c["name"].lower().strip(): c for c in contacts if c.get("name")}
    print(f"  {len(contacts)} contacts loaded")

    print("\nDeleting all existing vessel records...")
    sb_delete("vessels", {"id": "neq.00000000-0000-0000-0000-000000000000"})
    print("  Done.")

    print("\nInserting vessels from XLS...")
    inserted = 0
    unmatched = []
    contact_vessels = {}  # contact_id -> list of vessel dicts

    for c in customers:
        match = None
        if c["email"]:
            match = email_map.get(c["email"].lower())
        if not match and c["name"]:
            match = name_map.get(c["name"].lower().strip())

        if not match:
            if c["vessels"]:
                unmatched.append(c["name"])
            continue

        if not c["vessels"]:
            continue

        rows = [
            {
                "owner_id":   match["id"],
                "asset_type": "vessel",
                "year":       v["year"],
                "make_model": v["make_model"],
                "length_ft":  v["length_ft"],
            }
            for v in c["vessels"]
        ]
        sb_post("vessels", rows)
        inserted += len(rows)
        contact_vessels[match["id"]] = {
            "qb_customer_id": match.get("qb_customer_id"),
            "vessels": c["vessels"],
        }
        print(f"  {match['name']}: {[v['make_model'] for v in c['vessels']]}")

    print(f"\n  Inserted {inserted} vessels across {len(contact_vessels)} contacts")
    if unmatched:
        print(f"  No CRM match for: {unmatched}")

    # ── Sync to QB Notes ──────────────────────────────────────────────────────
    print("\nSyncing vessels to QuickBooks Notes...")
    tokens = get_qb_tokens()
    if not tokens:
        print("  QB not connected — skipping Notes sync.")
        return

    synced = 0
    for contact_id, data in contact_vessels.items():
        qb_id = data["qb_customer_id"]
        if not qb_id:
            continue

        resp = qb_request(tokens, "GET", f"/customer/{qb_id}")
        if not resp:
            continue
        customer = resp.get("Customer", {})
        sync_token = customer.get("SyncToken")
        existing_notes = customer.get("Notes", "") or ""

        new_notes = build_notes_with_vessels(existing_notes, data["vessels"])
        if new_notes == existing_notes:
            continue

        result = qb_request(tokens, "POST", "/customer", {
            "Id": qb_id,
            "SyncToken": sync_token,
            "sparse": True,
            "Notes": new_notes,
        })
        if result:
            synced += 1
            print(f"  QB Notes updated for {qb_id}")
        time.sleep(0.1)  # gentle rate limiting

    print(f"\n  QB Notes synced for {synced} customers")
    print("\nDone.")

if __name__ == "__main__":
    main()
