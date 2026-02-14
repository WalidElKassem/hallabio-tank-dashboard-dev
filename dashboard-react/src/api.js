const DEFAULT_BASE = "https://hallabio-tank-api-dev.walidelkassems.workers.dev/api";
export const LOW_THRESHOLD = Number(import.meta.env.VITE_LOW_THRESHOLD ?? 20);
export const AUTH_ENABLED = String(import.meta.env.VITE_AUTH_ENABLED ?? "false") === "true";

let runtimeConfig = null;

async function loadRuntimeConfig() {
  if (runtimeConfig !== null) return runtimeConfig;
  try {
    const res = await fetch("/config.json", { method: "GET" });
    if (!res.ok) throw new Error("config.json not available");
    runtimeConfig = await res.json();
  } catch {
    runtimeConfig = {};
  }
  return runtimeConfig;
}

export async function resolveApiBase() {
  const cfg = await loadRuntimeConfig();
  return import.meta.env.VITE_API_BASE_URL || cfg.apiBaseUrl || DEFAULT_BASE;
}

function createHeaders(authHeader, includeJson) {
  const headers = {};
  if (AUTH_ENABLED && authHeader) headers.Authorization = authHeader;
  if (includeJson) headers["Content-Type"] = "application/json";
  return headers;
}

export async function apiGet(path, authHeader) {
  if (AUTH_ENABLED && !authHeader) throw new Error("Not logged in");
  const base = await resolveApiBase();
  const res = await fetch(base + path, {
    method: "GET",
    headers: createHeaders(authHeader, false),
  });
  return { status: res.status, text: await res.text() };
}

export async function apiPost(path, authHeader, jsonBody) {
  if (AUTH_ENABLED && !authHeader) throw new Error("Not logged in");
  const base = await resolveApiBase();
  const hasBody = jsonBody !== undefined;
  const res = await fetch(base + path, {
    method: "POST",
    headers: createHeaders(authHeader, hasBody),
    ...(hasBody ? { body: JSON.stringify(jsonBody) } : {}),
  });
  return { status: res.status, text: await res.text() };
}

export function normalizeSensorMode(mode) {
  const m = String(mode || "").toLowerCase();
  if (m === "real") return "real";
  if (m === "sim" || m === "simulated" || m === "simulation") return "sim";
  return null;
}

export function extractConfigModes(configObj) {
  const out = {};
  const readFromMap = (mapObj) => {
    if (!mapObj || typeof mapObj !== "object" || Array.isArray(mapObj)) return;
    ["tankA", "tankB"].forEach((id) => {
      const direct = normalizeSensorMode(mapObj[id]);
      const nested = normalizeSensorMode(mapObj[id]?.mode);
      if (direct) out[id] = direct;
      else if (nested) out[id] = nested;
    });
  };

  const readFromList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      const id = item?.device_id || item?.id;
      const mode = normalizeSensorMode(item?.mode || item?.sensor_mode);
      if (id && mode) out[id] = mode;
    });
  };

  [configObj, configObj?.data].forEach((root) => {
    if (!root || typeof root !== "object") return;
    readFromMap(root.modes);
    readFromMap(root.sensor_modes);
    readFromMap(root.device_modes);
    readFromMap(root);
    readFromList(root.devices);
  });

  return out;
}
