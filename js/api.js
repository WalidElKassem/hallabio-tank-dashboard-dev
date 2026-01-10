// API helpers using window.API_BASE and window.authHeader
window.apiGet = async function(path){
  if (!window.authHeader) throw new Error("Not logged in");
  const res = await fetch(window.API_BASE + path, { method: "GET", headers: { "Authorization": window.authHeader } });
  const text = await res.text();
  return { status: res.status, text };
}

window.apiPost = async function(path){
  if (!window.authHeader) throw new Error("Not logged in");
  const res = await fetch(window.API_BASE + path, { method: "POST", headers: { "Authorization": window.authHeader } });
  const text = await res.text();
  return { status: res.status, text };
}
