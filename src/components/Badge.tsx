import type { ReactNode } from "react";
import { KernBadge } from "../ui/kern";

export type BadgeVariant = "basis" | "empty" | "demo" | "neutral" | "nicht-geladen";

const kernVariant: Record<BadgeVariant, "info" | "warning" | "success"> = {
  basis: "info",
  empty: "warning",
  demo: "info",
  neutral: "info",
  "nicht-geladen": "warning",
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
  const label = typeof children === "string" ? children : String(children ?? "");
  return (
    <span className={className}>
      <KernBadge label={label} variant={kernVariant[variant]} />
    </span>
  );
}
