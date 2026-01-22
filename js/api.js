// API helpers using window.API_BASE and window.authHeader
window.apiGet = async function(path){
  if (window.AUTH_ENABLED && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (window.AUTH_ENABLED && window.authHeader) headers.Authorization = window.authHeader;
  const res = await fetch(window.API_BASE + path, { method: "GET", headers });
  const text = await res.text();
  return { status: res.status, text };
}

window.apiPost = async function(path){
  if (window.AUTH_ENABLED && !window.authHeader) throw new Error("Not logged in");
  const headers = {};
  if (window.AUTH_ENABLED && window.authHeader) headers.Authorization = window.authHeader;
  const res = await fetch(window.API_BASE + path, { method: "POST", headers });
  const text = await res.text();
  return { status: res.status, text };
}
