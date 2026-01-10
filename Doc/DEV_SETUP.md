# HallabIO Tank Monitoring — DEV Setup (Cloudflare Workers + KV + D1 + GitHub Pages)

This README is a **complete, step-by-step** record of what was built in the DEV environment so the system can be reproduced later with minimal guesswork.

---

## Goal & Constraints

- Read tank level (%) from two ESP32 devices (`tankA`, `tankB`)
- Accessible from anywhere (not same Wi‑Fi)
- Read-only dashboard
- Update rate: ~3–4 scheduled reads/day + on-demand “Read now”
- History: last 5 days
- Private data
- Minimum maintenance
- Free-tier friendly (for DEV/testing)

---

## High-Level Architecture

ESP32 devices → Cloudflare Worker (API) → KV (latest/config/commands) + D1 (history)  
GitHub Pages dashboard → Cloudflare Worker (read-only, Basic Auth)

---

## Environment Naming (DEV)

- Worker: `hallabio-tank-api-dev`
- Worker URL:
  - https://hallabio-tank-api-dev.walidelkassems.workers.dev
- Dashboard (GitHub Pages):
  - https://walidelkassem.github.io/hallabio-tank-dashboard-dev/
- Devices:
  - `tankA`
  - `tankB`

---

## Repositories Created

1. **hallabio-tank-monitor**
   - Backend Worker logic
   - ESP32 firmware (PlatformIO / Arduino, later)
   - Central documentation

2. **hallabio-tank-dashboard-dev**
   - DEV dashboard
   - Points to DEV Worker

3. **hallabio-tank-dashboard**
   - PROD dashboard (future)

---

## Cloudflare Setup (DETAILED)

### 1. Create Worker (DEV)

Cloudflare Dashboard → Compute & AI → Workers & Pages  
Create Worker:
- Name: `hallabio-tank-api-dev`
- Template: Hello World
- Deploy

Verify:
- Open worker URL
- Confirm it responds

---

### 2. Create Workers KV Namespaces (DEV)

Cloudflare → Storage & databases → Workers KV

Create **exactly**:

- `latest_dev`
- `config_dev`
- `cmdq_dev`
- `cmdack_dev`

Purpose:
- `latest_dev` → last known reading per device
- `config_dev` → per-device config
- `cmdq_dev` → read-now command queue
- `cmdack_dev` → command acknowledgements

---

### 3. Create D1 Database (DEV)

Cloudflare → Storage & databases → D1  
Create database:
- Name: `hallabio_tank_dev`

---

### 4. Bind Resources to Worker

Worker → Bindings → Add binding

KV bindings:
- `KV_LATEST` → `latest_dev`
- `KV_CONFIG` → `config_dev`
- `KV_CMDQ` → `cmdq_dev`
- `KV_CMDACK` → `cmdack_dev`

D1 binding:
- `DB` → `hallabio_tank_dev`

---

### 5. Configure Worker Secrets

Worker → Settings → Variables → Secrets

Add:

Basic Auth (dashboard):
- `BASIC_AUTH_USER_DEV`
- `BASIC_AUTH_PASS_DEV`

Device keys:
- `DEVICE_KEY_TANKA_DEV`
- `DEVICE_KEY_TANKB_DEV`

⚠️ Secrets cannot be viewed after saving — reset if forgotten.

---

## KV Data Initialization

### Device Config (config_dev)

Keys:
- `config:tankA`
- `config:tankB`

Example value:
```json
{
  "schedule_times": ["08:00", "14:00", "20:00"],
  "timezone": "Asia/Beirut",
  "low_threshold_pct": 20,
  "command_poll_sec": 20,
  "min_seconds_between_reads": 60
}
```

---

### Latest Values (latest_dev)

Keys:
- `latest:tankA`
- `latest:tankB`

Example:
```json
{
  "level_pct": 73,
  "ts": "2026-01-09T12:00:00+02:00",
  "source": "scheduled"
}
```

---

## D1 Schema

Run **each statement separately** in the D1 console.

### readings
```sql
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  level_pct REAL NOT NULL,
  source TEXT NOT NULL
);
```

```sql
CREATE INDEX IF NOT EXISTS idx_readings_device_ts
ON readings(device_id, ts);
```

### alerts
```sql
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  level_pct REAL NOT NULL,
  threshold_pct REAL NOT NULL
);
```

```sql
CREATE INDEX IF NOT EXISTS idx_alerts_device_ts
ON alerts(device_id, ts);
```

Verify:
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

---

## API Endpoints (DEV)

### Dashboard (Basic Auth)

- `GET /api/latest?device_id=tankA`
- `GET /api/history?device_id=tankA&days=5`
- `POST /api/command/read_now?device_id=tankA`

---

### Device (X-Device-Key)

- `POST /api/device/ingest`
- `GET /api/device/commands`
- `POST /api/device/ack`

---

## Read-Now Command Flow (One Pending)

1. Dashboard creates command
2. Worker stores `cmd:read_now:<device>`
3. Device polls commands
4. Device measures immediately
5. Device ingests reading (`source=on_demand`)
6. Device ACK clears command

TTL prevents stale commands.

---

## GitHub Pages (DEV Dashboard)

Repo must be **public**.

GitHub:
- Repo → Settings → Pages
- Source: main / root
- Save

Result:
- https://walidelkassem.github.io/hallabio-tank-dashboard-dev/

Dashboard behavior:
- Prompts for Basic Auth
- Fetches latest values
- Displays JSON (DEV phase)

---

## Validation Performed

- Worker reachable via HTTPS
- Basic Auth enforced
- Device-key auth enforced
- KV updated on ingest
- D1 history stored
- Read-now command lifecycle confirmed
- Dashboard successfully fetches data

---

## Known Pitfalls / Notes

- D1 console rejects multi-statement SQL
- Secrets are write-only
- GitHub Pages may cache aggressively
- CORS origin must match exactly

---

## Next Steps

1. ESP32 firmware integration (PlatformIO / Arduino)
2. Dashboard UI polish (Read Now button, history view)
3. PROD environment (separate Worker, KV, D1, secrets)
4. Optional custom domain + tighter access control

---

## Status

✅ DEV backend complete  
✅ Commanding verified  
✅ Dashboard connected  

This README represents the **authoritative DEV setup reference**.
