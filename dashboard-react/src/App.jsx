import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import TankLevelCard from "./components/TankLevelCard";
import StatusCards from "./components/StatusCards";
import EventsTable from "./components/EventsTable";
import ErrorBanner from "./components/ErrorBanner";
import {
  apiGet,
  apiPost,
  AUTH_ENABLED,
  extractConfigModes,
  normalizeSensorMode,
} from "./api";

const DEVICES = ["tankA", "tankB"];
const POLL_MS = 60_000;

const initialState = Object.fromEntries(
  DEVICES.map((id) => [id, { latest: null, history: [], sensorMode: "sim", modeMsg: "Mode: Simulated" }]),
);

const baseTitle = {
  tankA: "tankA-Tripoli",
  tankB: "tankB-Tripoli",
};

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isOnline(ts) {
  const ms = Date.parse(ts || "");
  return Number.isFinite(ms) && Date.now() - ms <= 6 * 60 * 1000;
}

export default function App() {
  const [authHeader, setAuthHeader] = useState(null);
  const [tanks, setTanks] = useState(initialState);
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loggedIn = !AUTH_ENABLED || Boolean(authHeader);

  const updateTank = useCallback((id, patch) => {
    setTanks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const refreshOne = useCallback(
    async (deviceId) => {
      const latestResp = await apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`, authHeader);
      let latestObj = null;
      try {
        latestObj = JSON.parse(latestResp.text);
      } catch {
        latestObj = null;
      }

      const histResp = await apiGet(`/history?device_id=${encodeURIComponent(deviceId)}&days=5`, authHeader);
      let histObj = null;
      try {
        histObj = JSON.parse(histResp.text);
      } catch {
        histObj = null;
      }

      updateTank(deviceId, { latest: latestObj, history: histObj?.readings || [] });
    },
    [authHeader, updateTank],
  );

  const loadConfigModes = useCallback(async () => {
    if (AUTH_ENABLED && !authHeader) return;
    const r = await apiGet("/config", authHeader);
    if (r.status < 200 || r.status >= 300) throw new Error(`Config request failed (HTTP ${r.status})`);
    let obj = null;
    try {
      obj = JSON.parse(r.text);
    } catch {
      throw new Error("Invalid JSON from /config");
    }
    const modes = extractConfigModes(obj);
    DEVICES.forEach((deviceId) => {
      const mode = modes[deviceId] || "sim";
      updateTank(deviceId, { sensorMode: mode, modeMsg: `Mode: ${mode === "real" ? "Real" : "Simulated"}` });
    });
  }, [authHeader, updateTank]);

  const refreshAll = useCallback(async () => {
    if (loading) return;
    if (AUTH_ENABLED && !authHeader) {
      setStatus("Login required: click Login to load your tanks.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("Loading...");
    try {
      await Promise.all(DEVICES.map(refreshOne));
      setStatus("Updated.");
    } catch (e) {
      setError(`Error: ${e?.message || e}`);
      setStatus(`Error: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [authHeader, loading, refreshOne]);

  const readNow = useCallback(
    async (deviceId) => {
      if (AUTH_ENABLED && !authHeader) return;
      setStatus(`Sending Read Now for ${deviceId}…`);
      try {
        const before = await apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`, authHeader);
        const oldTs = JSON.parse(before.text)?.data?.ts || null;
        const r = await apiPost(`/command/read_now?device_id=${encodeURIComponent(deviceId)}`, authHeader);
        setStatus(`Read Now sent (HTTP ${r.status}). Waiting for device…`);

        const start = Date.now();
        while (Date.now() - start < 70_000) {
          await new Promise((res) => setTimeout(res, 4_000));
          const latest = await apiGet(`/latest?device_id=${encodeURIComponent(deviceId)}`, authHeader);
          const newTs = JSON.parse(latest.text)?.data?.ts || null;
          if (newTs && newTs !== oldTs) {
            setStatus(`${deviceId} updated successfully.`);
            await refreshAll();
            return;
          }
        }
        setStatus(`Timeout waiting for ${deviceId}. Check ESP32 is online.`);
      } catch (e) {
        setError(`Error: ${e?.message || e}`);
      }
    },
    [authHeader, refreshAll],
  );

  const setSensorMode = useCallback(
    async (deviceId, mode) => {
      const normalized = normalizeSensorMode(mode);
      if (!normalized) throw new Error("Invalid sensor mode");
      try {
        const r = await apiPost("/command/set_sensor_mode", authHeader, { device_id: deviceId, mode: normalized });
        if (r.status >= 200 && r.status < 300) return r;
        const fallback = await apiPost(
          `/command/set_sensor_mode?device_id=${encodeURIComponent(deviceId)}&mode=${encodeURIComponent(normalized)}`,
          authHeader,
        );
        if (fallback.status < 200 || fallback.status >= 300) {
          throw new Error(`Set mode failed (HTTP ${fallback.status})`);
        }
      } catch {
        const fallback = await apiPost(
          `/command/set_sensor_mode?device_id=${encodeURIComponent(deviceId)}&mode=${encodeURIComponent(normalized)}`,
          authHeader,
        );
        if (fallback.status < 200 || fallback.status >= 300) throw new Error(`Set mode failed (HTTP ${fallback.status})`);
      }
    },
    [authHeader],
  );

  const toggleMode = useCallback(
    async (deviceId, checked) => {
      const previous = tanks[deviceId].sensorMode || "sim";
      const next = checked ? "real" : "sim";
      updateTank(deviceId, { modeMsg: "Updating mode..." });
      try {
        await setSensorMode(deviceId, next);
        updateTank(deviceId, { sensorMode: next, modeMsg: `Mode set to ${next === "real" ? "Real" : "Simulated"}` });
      } catch (e) {
        updateTank(deviceId, {
          sensorMode: previous,
          modeMsg: "Failed to set mode",
        });
        setError(`Error: ${e?.message || e}`);
      }
    },
    [setSensorMode, tanks, updateTank],
  );

  useEffect(() => {
    refreshAll();
    loadConfigModes().catch((e) => setStatus(`Config load warning: ${e?.message || e}`));
  }, [refreshAll, loadConfigModes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) refreshAll();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshAll]);

  const doLogin = () => {
    const user = window.prompt("DEV API username:");
    if (user === null) return;
    const pass = window.prompt("DEV API password:");
    if (pass === null) return;
    setAuthHeader(`Basic ${window.btoa(`${user}:${pass}`)}`);
  };

  const tankViews = useMemo(
    () =>
      DEVICES.map((id) => {
        const d = tanks[id];
        return {
          id,
          title: `${baseTitle[id]} (fw ver: ${d.latest?.data?.firmware_version?.toString().trim() || "unknown"})`,
          latest: d.latest,
          history: (d.history || []).slice().sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 30),
          online: isOnline(d.latest?.data?.ts),
          lastUpdated: formatTs(d.latest?.data?.ts),
          sensorMode: d.sensorMode,
          modeMsg: d.modeMsg,
        };
      }),
    [tanks],
  );

  return (
    <AppShell onRefresh={refreshAll} status={status} isLoading={loading}>
      <div className="mb-4 flex gap-2">
        {AUTH_ENABLED && !loggedIn ? (
          <button type="button" onClick={doLogin} className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950">
            Login
          </button>
        ) : null}
        {AUTH_ENABLED && loggedIn ? (
          <button
            type="button"
            onClick={() => {
              setAuthHeader(null);
              setStatus("Login required: click Login to load your tanks.");
            }}
            className="rounded-lg border border-slate-700 px-4 py-2"
          >
            Change Login
          </button>
        ) : null}
      </div>

      <ErrorBanner error={error} onDismiss={() => setError("")} />

      <div className="grid gap-5">
        {tankViews.map((tank) => (
          <article key={tank.id} className="grid gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <TankLevelCard tank={tank} />
              <StatusCards tank={tank} />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <label className="flex items-center gap-2 text-sm">
                Sensor Mode: Simulated / Real
                <input
                  type="checkbox"
                  checked={tank.sensorMode === "real"}
                  disabled={!loggedIn}
                  onChange={(e) => toggleMode(tank.id, e.target.checked)}
                />
              </label>
              <span className="text-sm text-slate-400">{tank.modeMsg}</span>
              <button
                type="button"
                onClick={() => readNow(tank.id)}
                disabled={!loggedIn}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Read now
              </button>
            </div>

            <EventsTable readings={tank.history} />
          </article>
        ))}
      </div>
    </AppShell>
  );
}
