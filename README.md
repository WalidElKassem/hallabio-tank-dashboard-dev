# HallabIO Tank Dashboard – DEV

This repository hosts the **development dashboard UI** for the HallabIO tank monitoring system.

It is deployed using **GitHub Pages** and is intended **only for testing and validation** against the DEV backend.

---

## 🎯 Purpose

- Validate new UI changes
- Test API changes before production
- Verify features like:
  - Latest tank level display
  - 5-day history
  - “Read now” command
  - Low-level alerts

This dashboard talks **only** to the DEV API.

---

## 🔌 Backend اتصال (Connection)

DEV API endpoint:
https://hallabio-tank-api-dev.workers.dev/api


The endpoint is configured in `config.json`.

---

## 🔐 Access Control

- Dashboard is static and public
- All data access is protected by **HTTP Basic Auth** enforced by the backend
- No secrets are stored in this repository

---

## 📦 Repository Contents

Typical structure:
hallabio-tank-dashboard-dev/
├─ index.html
├─ config.json
├─ assets/
└─ README.md


---

## 🧪 How It’s Used

1. Backend changes are deployed to DEV
2. UI changes are deployed here
3. Full system is tested end-to-end
4. Only after validation, changes are promoted to production

---

## ⚠️ Important Notes

- This dashboard may break
- This dashboard may show test data
- This dashboard may change frequently

**Do not rely on this UI for production monitoring.**

---

## 🏷 License
TBD
