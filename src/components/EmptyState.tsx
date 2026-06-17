import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  className?: string;
}

export function EmptyState({
  title = "Keine Daten",
  description,
  message,
  className = "",
}: EmptyStateProps) {
  const body = description ?? message ?? "Keine Daten für die aktuelle Auswahl.";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center ${className}`}
    >
      <Inbox className="mb-2 h-8 w-8 text-slate-400" aria-hidden />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{body}</p>
    </div>
  );
}
