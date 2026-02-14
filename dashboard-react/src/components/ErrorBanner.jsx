export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-100">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm">{error}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-rose-400/40 px-2 py-1 text-xs hover:bg-rose-500/20"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
