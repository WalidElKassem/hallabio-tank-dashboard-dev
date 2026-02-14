import { CircleGauge, Droplets } from "lucide-react";

const tone = {
  low: "text-rose-400",
  medium: "text-amber-300",
  good: "text-emerald-300",
};

function tier(level) {
  if (!Number.isFinite(level)) return "medium";
  if (level < 20) return "low";
  if (level <= 60) return "medium";
  return "good";
}

export default function TankLevelCard({ tank }) {
  const level = Number(tank?.latest?.data?.level_pct);
  const percent = Number.isFinite(level) ? Math.max(0, Math.min(100, level)) : 0;
  const bucket = tier(level);
  const ring = {
    background: `conic-gradient(currentColor ${percent * 3.6}deg, rgb(30 41 59) 0deg)`,
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tank.title}</h2>
        <span className={`text-xs font-semibold uppercase ${tank.online ? "text-emerald-300" : "text-slate-400"}`}>
          {tank.online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
        <div className={`relative mx-auto flex h-32 w-32 items-center justify-center rounded-full ${tone[bucket]}`} style={ring}>
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-950">
            <CircleGauge className="mb-1 h-4 w-4" />
            <div className="text-xl font-bold">{Number.isFinite(level) ? `${level.toFixed(1)}%` : "--%"}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Droplets className={`h-4 w-4 ${tone[bucket]}`} /> Tank Fill
          </div>
          <div className="h-24 rounded-lg border border-slate-800 bg-slate-900 p-2">
            <div className="relative h-full w-16 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
              <div
                className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${bucket === "low" ? "bg-rose-500/80" : bucket === "medium" ? "bg-amber-500/80" : "bg-emerald-500/80"}`}
                style={{ height: `${percent}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-400">Last update: {tank.lastUpdated}</p>
        </div>
      </div>
    </section>
  );
}
