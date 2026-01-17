// Core actions: refresh, readNow, wiring
window.refreshOne = async function(deviceId){
  const latestResp = await window.apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`);
  let latestObj = null; try { latestObj = JSON.parse(latestResp.text); } catch {}
  window.setTankUI(deviceId, latestObj);

  const histResp = await window.apiGet(`/history?device_id=${encodeURIComponent(deviceId)}&days=5`);
  let histObj = null; try { histObj = JSON.parse(histResp.text); } catch {}
  window.setHistoryUI(deviceId, histObj?.readings || []);
}

window.refreshAll = async function(){
  if (window.AUTH_ENABLED && !window.authHeader) { window.updateLoginUI(); return; }
  window.setStatus("Loading…");
  try {
    await Promise.all([window.refreshOne("tankA"), window.refreshOne("tankB")]);
    window.setStatus("Updated.");
  } catch (e) {
    window.setStatus("Error: " + (e?.message || e));
  }
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

// Wiring event handlers
document.addEventListener('DOMContentLoaded', function(){
  const btnLogin = document.getElementById("btnLoginTop");
  const btnChange = document.getElementById("btnChangeLogin");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnReadNowA = document.getElementById("btnReadNowA");
  const btnReadNowB = document.getElementById("btnReadNowB");

  if(btnLogin) btnLogin.addEventListener('click', () => window.login());
  if(btnChange) btnChange.addEventListener('click', () => { window.authHeader = null; window.updateLoginUI(); window.login(); });
  if(btnRefresh) btnRefresh.addEventListener('click', () => window.refreshAll());
  if(btnReadNowA) btnReadNowA.addEventListener('click', () => window.readNow('tankA'));
  if(btnReadNowB) btnReadNowB.addEventListener('click', () => window.readNow('tankB'));

  // initial UI state
  window.updateLoginUI();
});
