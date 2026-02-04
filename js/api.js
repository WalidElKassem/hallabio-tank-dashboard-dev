// API helpers using window.API_BASE and window.authHeader
window.apiGet = async function(path){
  if (window.AUTH_ENABLED && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (window.AUTH_ENABLED && window.authHeader) headers.Authorization = window.authHeader;
  const res = await fetch(window.API_BASE + path, { method: "GET", headers });
  const text = await res.text();
  return { status: res.status, text };
}

window.apiPost = async function(path, jsonBody){
  if (window.AUTH_ENABLED && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (window.AUTH_ENABLED && window.authHeader) headers.Authorization = window.authHeader;
  const opts = { method: "POST", headers };
  if (jsonBody !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(jsonBody);
  }
  const res = await fetch(window.API_BASE + path, opts);
  const text = await res.text();
  return { status: res.status, text };
}
