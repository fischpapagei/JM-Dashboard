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
      className={`flex flex-col items-center justify-center rounded border-2 border-dashed border-(--color-border) bg-white px-4 py-8 text-center ${className}`}
    >
      <Inbox className="mb-2 h-8 w-8 text-(--color-ink)" aria-hidden />
      <p className="text-sm font-semibold text-(--color-ink)">{title}</p>
      <p className="mt-1 max-w-md text-sm text-(--color-muted)">{body}</p>
    </div>
  );
}
