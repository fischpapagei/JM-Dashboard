import { Badge } from "./Badge";
import type { RegulaereTerminationReasonRow } from "../utils/aggregations";
import { formatNumber } from "../utils/format";

interface RegulaereTerminationReasonsCardProps {
  rows: RegulaereTerminationReasonRow[];
  demoMode: boolean;
  badge?: string;
}

export function RegulaereTerminationReasonsCard({
  rows,
  demoMode,
  badge,
}: RegulaereTerminationReasonsCardProps) {
  const showBadge = Boolean(badge) || !demoMode;

  return (
    <article className="dashboard-kpi p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-(--color-ink)">Reguläre Beendigung</h3>
          <p className="mt-0.5 text-[11px] font-medium text-(--color-muted)">Beendigungsgründe · Anzahl</p>
        </div>
        {showBadge && (
          <Badge variant={badge === "Demo-Daten" ? "demo" : "empty"}>
            {badge ?? "nicht geladen"}
          </Badge>
        )}
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start justify-between gap-2">
            <span className="text-[11px] leading-snug font-medium text-(--color-ink)">{row.label}</span>
            <span className="shrink-0 text-sm font-semibold text-(--color-ink)">
              {demoMode ? formatNumber(row.count) : "—"}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-center text-[11px] font-medium text-(--color-muted)">Daten aus BASIS-Web</p>
    </article>
  );
}
