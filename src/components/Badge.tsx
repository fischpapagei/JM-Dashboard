import type { ReactNode } from "react";

export type BadgeVariant = "basis" | "empty" | "demo" | "neutral" | "nicht-geladen";

const styles: Record<BadgeVariant, string> = {
  basis: "bg-sky-100 text-sky-900 border-sky-200",
  empty: "bg-amber-50 text-amber-900 border-amber-200",
  demo: "bg-violet-100 text-violet-900 border-violet-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  "nicht-geladen": "bg-amber-50 text-amber-900 border-amber-200",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
