export default function AppShell({ children, onRefresh, status, isLoading }) {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hallab Diesel Tank Dashboard</h1>
          <p className="text-sm text-slate-400">ESP32-Tank-Monitor · React UI</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </header>
      <p className="mb-4 text-sm text-slate-400">{status}</p>
      {children}
    </div>
  );
}
