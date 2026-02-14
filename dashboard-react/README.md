# Dashboard React (Vite + Tailwind)

Modern React/Tailwind frontend for the existing ESP32 Tank Monitor dashboard API.

## Run locally

```bash
npm install
npm run dev
```

## Build static assets (GitHub Pages)

```bash
npm run build
```

Build output is written to `dashboard-react/dist/` and can be deployed to GitHub Pages/static hosting.

## Migration notes

Original responsibilities were split across:
- `index.html` for layout and controls
- `js/api.js` for API request shape/auth headers
- `js/main.js` for orchestration (refresh/load/read-now/mode toggles)
- `js/ui.js` for rendering and formatting helpers

React migration keeps the same network behavior:
- GET `/latest?device_id=...`
- GET `/history?device_id=...&days=5`
- GET `/config`
- POST `/command/read_now?device_id=...`
- POST `/command/set_sensor_mode` with JSON body and query-param fallback

Header/payload compatibility is preserved:
- `Authorization` only when auth is enabled and user logged in
- `Content-Type: application/json` only when a JSON body is provided

On initial render, data is loaded immediately and polling remains at 60 seconds.
