// API helpers using window.API_BASE and window.authHeader
window.apiGet = async function(path){
  const authEnabled = window.AUTH_ENABLED !== false;
  if (authEnabled && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (authEnabled && window.authHeader) {
    headers.Authorization = window.authHeader;
  } else if (!authEnabled) {
    headers.Authorized = "true";
  }
  const res = await fetch(window.API_BASE + path, { method: "GET", headers });
  const text = await res.text();
  return { status: res.status, text };
}

window.apiPost = async function(path){
  const authEnabled = window.AUTH_ENABLED !== false;
  if (authEnabled && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (authEnabled && window.authHeader) {
    headers.Authorization = window.authHeader;
  } else if (!authEnabled) {
    headers.Authorized = "true";
  }
  const res = await fetch(window.API_BASE + path, { method: "POST", headers });
  const text = await res.text();
  return { status: res.status, text };
}
