import { Clock3, Wifi } from "lucide-react";

export default function StatusCards({ tank }) {
  const d = tank?.latest?.data || {};
  const entries = [
    { label: "Source", value: d.source || "—" },
    { label: "Timestamp", value: d.ts || "—" },
    { label: "Firmware", value: d.firmware_version || "unknown" },
    { label: "OTA", value: d.ota_status || "—" },
    { label: "Wi-Fi", value: d.wifi_status || "—" },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-center gap-2 text-slate-300">
        <Wifi className="h-4 w-4" />
        <h3 className="font-semibold">Status</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 break-all text-sm text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Clock3 className="h-3 w-3" /> Local time history over last 5 days.
      </p>
    </section>
  );
}
