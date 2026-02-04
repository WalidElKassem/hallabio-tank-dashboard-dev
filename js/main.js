window.sensorModeMap = { tankA: "sim", tankB: "sim" };

window.normalizeSensorMode = function(mode){
  const m = String(mode || "").toLowerCase();
  if (m === "real") return "real";
  if (m === "sim" || m === "simulated" || m === "simulation") return "sim";
  return null;
}

window.sensorModeLabel = function(mode){
  return mode === "real" ? "Real" : "Simulated";
}

window.renderSensorMode = function(deviceId, message, isError){
  const suf = deviceId === "tankA" ? "A" : "B";
  const toggle = document.getElementById("mode" + suf);
  const msg = document.getElementById("modeMsg" + suf);
  const mode = window.sensorModeMap[deviceId] === "real" ? "real" : "sim";
  if (toggle) toggle.checked = mode === "real";
  if (msg) {
    msg.textContent = message || ("Mode: " + window.sensorModeLabel(mode));
    msg.classList.toggle("error", !!isError);
  }
}

window.extractConfigModes = function(configObj){
  const out = {};

  const readFromMap = function(mapObj){
    if (!mapObj || typeof mapObj !== "object" || Array.isArray(mapObj)) return;
    for (const id of ["tankA", "tankB"]) {
      const direct = window.normalizeSensorMode(mapObj[id]);
      const nested = window.normalizeSensorMode(mapObj[id] && mapObj[id].mode);
      if (direct) out[id] = direct;
      else if (nested) out[id] = nested;
    }
  };

  const readFromList = function(list){
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const id = item && (item.device_id || item.id);
      const mode = window.normalizeSensorMode(item && (item.mode || item.sensor_mode));
      if (id && mode) out[id] = mode;
    }
  };

  const roots = [configObj, configObj && configObj.data];
  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    readFromMap(root.modes);
    readFromMap(root.sensor_modes);
    readFromMap(root.device_modes);
    readFromMap(root);
    readFromList(root.devices);
  }
  return out;
}

window.loadConfigModes = async function(){
  if (window.AUTH_ENABLED && !window.authHeader) return;
  const r = await window.apiGet("/config");
  if (r.status < 200 || r.status >= 300) throw new Error("Config request failed (HTTP " + r.status + ")");
  let obj = null;
  try { obj = JSON.parse(r.text); } catch { throw new Error("Invalid JSON from /config"); }
  const map = window.extractConfigModes(obj);
  for (const deviceId of ["tankA", "tankB"]) {
    window.sensorModeMap[deviceId] = map[deviceId] || "sim";
    window.renderSensorMode(deviceId);
  }
}

window.setSensorMode = async function(deviceId, mode){
  const normalized = window.normalizeSensorMode(mode);
  if (!normalized) throw new Error("Invalid sensor mode");
  try {
    const r = await window.apiPost("/command/set_sensor_mode", { device_id: deviceId, mode: normalized });
    if (r.status >= 200 && r.status < 300) return r;
    const fallback = await window.apiPost(`/command/set_sensor_mode?device_id=${encodeURIComponent(deviceId)}&mode=${encodeURIComponent(normalized)}`);
    if (fallback.status < 200 || fallback.status >= 300) throw new Error("Set mode failed (HTTP " + fallback.status + ")");
    return fallback;
  } catch (_) {
    // Keep command shape compatible with endpoints that only accept query params.
    const fallback = await window.apiPost(`/command/set_sensor_mode?device_id=${encodeURIComponent(deviceId)}&mode=${encodeURIComponent(normalized)}`);
    if (fallback.status < 200 || fallback.status >= 300) throw new Error("Set mode failed (HTTP " + fallback.status + ")");
    return fallback;
  }
}

window.onSensorModeToggle = async function(deviceId){
  const suf = deviceId === "tankA" ? "A" : "B";
  const toggle = document.getElementById("mode" + suf);
  if (!toggle) return;

  const previousMode = window.sensorModeMap[deviceId] || "sim";
  const nextMode = toggle.checked ? "real" : "sim";
  toggle.disabled = true;
  window.renderSensorMode(deviceId, "Updating mode...");

  try {
    await window.setSensorMode(deviceId, nextMode);
    window.sensorModeMap[deviceId] = nextMode;
    window.renderSensorMode(deviceId, "Mode set to " + window.sensorModeLabel(nextMode));
  } catch (e) {
    window.sensorModeMap[deviceId] = previousMode;
    window.renderSensorMode(deviceId, "Failed to set mode", true);
    window.setStatus("Error: " + (e?.message || e));
  } finally {
    toggle.disabled = false;
  }
}

// Core actions: refresh, readNow, wiring
window.refreshOne = async function(deviceId){
  const latestResp = await window.apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`);
  let latestObj = null; try { latestObj = JSON.parse(latestResp.text); } catch {}
  window.setTankUI(deviceId, latestObj);

  const histResp = await window.apiGet(`/history?device_id=${encodeURIComponent(deviceId)}&days=5`);
  let histObj = null; try { histObj = JSON.parse(histResp.text); } catch {}
  window.setHistoryUI(deviceId, histObj?.readings || []);
}

window.readNow = async function(deviceId){
  if (window.AUTH_ENABLED && !window.authHeader) { window.updateLoginUI(); return; }
  const btn = document.getElementById(deviceId === "tankA" ? "btnReadNowA" : "btnReadNowB");
  if(!btn) return;
  btn.disabled = true; const oldTxt = btn.textContent; btn.textContent = "Working…";
  try {
    let oldTs = null;
    try { const latest = await window.apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`); const obj = JSON.parse(latest.text); oldTs = obj?.data?.ts || null; } catch {}
    window.setStatus(`Sending Read Now for ${deviceId}…`);
    const r = await window.apiPost(`/command/read_now?device_id=${encodeURIComponent(deviceId)}`);
    window.setStatus(`Read Now sent (HTTP ${r.status}). Waiting for device…`);

    const start = Date.now();
    while (Date.now() - start < 70000) {
      await new Promise(res => setTimeout(res, 4000));
      const latest = await window.apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`);
      const obj = JSON.parse(latest.text);
      const newTs = obj?.data?.ts || null;
      if (newTs && newTs !== oldTs) {
        window.setStatus(`${deviceId} updated successfully.`);
        await window.refreshAll();
        return;
      }
    }
    window.setStatus(`Timeout waiting for ${deviceId}. Check ESP32 is online.`);
  } catch (e) { window.setStatus("Error: " + (e?.message || e)); }
  finally { btn.disabled = false; btn.textContent = oldTxt; }
}

// Guard refreshAll to avoid overlapping refreshes.
window.refreshInFlight = false;
window.refreshAll = async function(){
  if (window.refreshInFlight) { return; }
  window.refreshInFlight = true;
  if (window.AUTH_ENABLED && !window.authHeader) { window.updateLoginUI(); window.refreshInFlight = false; return; }
  window.setStatus("Loading...");
  try {
    await Promise.all([window.refreshOne("tankA"), window.refreshOne("tankB")]);
    window.setStatus("Updated.");
  } catch (e) {
    window.setStatus("Error: " + (e?.message || e));
  } finally {
    window.refreshInFlight = false;
  }
}

// Wiring event handlers
document.addEventListener('DOMContentLoaded', function(){
  const btnLogin = document.getElementById("btnLoginTop");
  const btnChange = document.getElementById("btnChangeLogin");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnReadNowA = document.getElementById("btnReadNowA");
  const btnReadNowB = document.getElementById("btnReadNowB");
  const modeA = document.getElementById("modeA");
  const modeB = document.getElementById("modeB");

  if(btnLogin) btnLogin.addEventListener('click', () => window.login());
  if(btnChange) btnChange.addEventListener('click', () => { window.authHeader = null; window.updateLoginUI(); window.login(); });
  if(btnRefresh) btnRefresh.addEventListener('click', () => window.refreshAll());
  if(btnReadNowA) btnReadNowA.addEventListener('click', () => window.readNow('tankA'));
  if(btnReadNowB) btnReadNowB.addEventListener('click', () => window.readNow('tankB'));
  if(modeA) modeA.addEventListener('change', () => window.onSensorModeToggle('tankA'));
  if(modeB) modeB.addEventListener('change', () => window.onSensorModeToggle('tankB'));

  window.renderSensorMode("tankA");
  window.renderSensorMode("tankB");

  // initial UI state
  window.updateLoginUI();

  // initial data load on page open
  if (btnRefresh) btnRefresh.disabled = true;
  const initialLoad = Promise.all([
    window.refreshAll(),
    window.loadConfigModes().catch((e) => {
      window.setStatus("Config load warning: " + (e?.message || e));
    })
  ]);
  if (initialLoad && typeof initialLoad.finally === "function") {
    initialLoad.finally(() => window.updateLoginUI());
  }

  const autoRefreshMs = 60 * 1000;
  window.autoRefreshTimer = window.setInterval(() => {
    if (!document.hidden) {
      window.refreshAll();
    }
  }, autoRefreshMs);
});
