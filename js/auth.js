// Simple auth handling (DEV basic auth via prompt)
window.authHeader = null;

window.updateLoginUI = function(){
  const gate = document.getElementById("loginGate");
  const grid = document.querySelector(".grid");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnChangeLogin = document.getElementById("btnChangeLogin");
  const btnLoginTop = document.getElementById("btnLoginTop");
  const btnReadNowA = document.getElementById("btnReadNowA");
  const btnReadNowB = document.getElementById("btnReadNowB");
  const modeA = document.getElementById("modeA");
  const modeB = document.getElementById("modeB");

  if (!window.AUTH_ENABLED) {
    if (gate) gate.style.display = "none";
    if (grid) grid.classList.remove("dimmed");

    if(btnRefresh) btnRefresh.disabled = false;
    if(btnReadNowA) btnReadNowA.disabled = false;
    if(btnReadNowB) btnReadNowB.disabled = false;
    if(modeA) modeA.disabled = false;
    if(modeB) modeB.disabled = false;

    if(btnChangeLogin) btnChangeLogin.style.display = "none";
    if(btnLoginTop) btnLoginTop.style.display = "none";
    if(window.setStatus) window.setStatus("Authentication disabled.");
    return;
  }

  if (!window.authHeader) {
    gate.style.display = "flex";
    grid.classList.add("dimmed");

    if(btnRefresh) btnRefresh.disabled = true;
    if(btnReadNowA) btnReadNowA.disabled = true;
    if(btnReadNowB) btnReadNowB.disabled = true;
    if(modeA) modeA.disabled = true;
    if(modeB) modeB.disabled = true;

    if(btnChangeLogin) btnChangeLogin.style.display = "none";
    if(btnLoginTop) btnLoginTop.style.display = "inline-block";
    if(window.setStatus) window.setStatus("Login required: tap Login to load your tanks.");
  } else {
    gate.style.display = "none";
    grid.classList.remove("dimmed");

    if(btnRefresh) btnRefresh.disabled = false;
    if(btnReadNowA) btnReadNowA.disabled = false;
    if(btnReadNowB) btnReadNowB.disabled = false;
    if(modeA) modeA.disabled = false;
    if(modeB) modeB.disabled = false;

    if(btnChangeLogin) btnChangeLogin.style.display = "inline-block";
    if(btnLoginTop) btnLoginTop.style.display = "none";
    if(window.setStatus) window.setStatus("Logged in. Tap Refresh to update.");
  }
}

window.login = function(){
  if (!window.AUTH_ENABLED) return;
  const user = prompt("DEV API username:");
  if (user === null) return;
  const pass = prompt("DEV API password:");
  if (pass === null) return;

  window.authHeader = "Basic " + btoa(user + ":" + pass);
  window.updateLoginUI();
  if(window.refreshAll) window.refreshAll();
  if(window.loadConfigModes) window.loadConfigModes();
}
