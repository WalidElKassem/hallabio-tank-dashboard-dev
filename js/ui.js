// UI helpers: status, formatting, rendering
window.setStatus = function(msg){
  const el = document.getElementById("status");
  if(el) el.textContent = msg;
}

window.formatTs = function(ts){
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit"
    });
  } catch {
    return ts;
  }
}

window.localDateKey = function(ts){
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

window.labelForDateKey = function(key){
  const today = window.localDateKey(new Date().toISOString());
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yesterday = window.localDateKey(y.toISOString());
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return key;
}

window.formatDeviceTitle = function(name, fwVersion){
  const raw = (fwVersion === undefined || fwVersion === null) ? "" : String(fwVersion);
  const fw = raw.trim().length === 0 ? "unknown" : raw;
  return name + " (fw ver: " + fw + ")";
}

window.updateDeviceTitle = function(deviceId, fwVersion){
  const suf = deviceId === "tankA" ? "A" : "B";
  const titleEl = document.getElementById("title" + suf);
  if (!titleEl) return;
  const base = titleEl.getAttribute("data-base") || titleEl.textContent || "";
  const next = window.formatDeviceTitle(base, fwVersion);
  if (titleEl.textContent !== next) titleEl.textContent = next;
}

window.setTankUI = function(deviceId, latestObj){
  const suf = deviceId === "tankA" ? "A" : "B";
  const levelEl = document.getElementById("level" + suf);
  const updatedEl = document.getElementById("updated" + suf);
  const sourceEl = document.getElementById("source" + suf);
  const tsEl = document.getElementById("ts" + suf);
  const badgeEl = document.getElementById("badge" + suf);
  const statusEl = document.getElementById("status" + suf);

  if (!latestObj || !latestObj.data) {
    window.updateDeviceTitle(deviceId, null);
    if(levelEl) levelEl.textContent = "--%";
    if(updatedEl) updatedEl.textContent = "Last updated: —";
    if(sourceEl) sourceEl.textContent = "—";
    if(tsEl) tsEl.textContent = "—";
    if(badgeEl) { badgeEl.className = "badge unknown"; badgeEl.textContent = "NO DATA"; }
    if(statusEl) { statusEl.className = "device-status offline"; statusEl.textContent = "OFFLINE"; }
    return;
  }

  const d = latestObj.data;
  window.updateDeviceTitle(deviceId, d.firmware_version);
  const lvl = Number(d.level_pct);

  if(levelEl) levelEl.textContent = (Number.isFinite(lvl) ? lvl.toFixed(1) : "--") + "%";
  if(updatedEl) updatedEl.textContent = "Last updated: " + window.formatTs(d.ts);
  if(sourceEl) sourceEl.textContent = d.source || "—";
  if(tsEl) tsEl.textContent = d.ts || "—";

  const tsMs = Date.parse(d.ts || "");
  const isOnline = Number.isFinite(tsMs) && (Date.now() - tsMs) <= (6 * 60 * 1000);
  if (statusEl) {
    statusEl.className = "device-status " + (isOnline ? "online" : "offline");
    statusEl.textContent = isOnline ? "ONLINE" : "OFFLINE";
  }

  // update badge
  if (Number.isFinite(lvl) && lvl < window.LOW_THRESHOLD) {
    if(badgeEl){ badgeEl.className = "badge low"; badgeEl.textContent = "LOW"; }
  } else {
    if(badgeEl){ badgeEl.className = "badge ok"; badgeEl.textContent = "OK"; }
  }

  // update circular gauge (SVG path meter)
  try {
    const meter = document.getElementById('meter' + suf);
    const pct = Number.isFinite(lvl) ? Math.max(0, Math.min(100, lvl)) : 0;
    if (meter) {
      meter.setAttribute('stroke-dasharray', `${pct} 100`);
      if (pct < window.LOW_THRESHOLD) meter.classList.add('low'); else meter.classList.remove('low');
    }
  } catch (e) {}
}

window.setHistoryUI = function(deviceId, readings){
  const ul = document.getElementById(deviceId === "tankA" ? "histA" : "histB");
  if(!ul) return;
  ul.innerHTML = "";

  if (!readings || readings.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No history yet.";
    ul.appendChild(li);
    return;
  }

  const sorted = readings.slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
  const groups = new Map();
  for (const r of sorted) {
    const key = window.localDateKey(r.ts);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const keys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));
  const MAX_ITEMS = 30; let rendered = 0;

  for (const key of keys) {
    if (rendered >= MAX_ITEMS) break;
    const headerLi = document.createElement("li");
    headerLi.style.marginTop = "10px";
    headerLi.style.listStyle = "none";
    headerLi.innerHTML = `<span class="muted" style="font-weight:800;">${window.labelForDateKey(key)}</span>`;
    ul.appendChild(headerLi);

    for (const r of groups.get(key)) {
      if (rendered >= MAX_ITEMS) break;
      const li = document.createElement("li");
      const lvl = Number(r.level_pct);
      const lvlTxt = Number.isFinite(lvl) ? lvl.toFixed(1) + "%" : "?%";
      li.innerHTML = `<span class="mono">${window.formatTs(r.ts)}</span> — <b>${lvlTxt}</b> <span class="muted">(${r.source || "?"})</span>`;
      ul.appendChild(li);
      rendered++;
    }
  }
}
