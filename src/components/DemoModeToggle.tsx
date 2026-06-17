interface DemoModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function DemoModeToggle({ enabled, onChange }: DemoModeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
        enabled
          ? "border-violet-300 bg-violet-100 text-violet-900"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${enabled ? "bg-violet-600" : "bg-slate-400"}`} />
      Demo-Daten {enabled ? "AN" : "AUS"}
    </button>
  );
}
