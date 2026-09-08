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
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-medium text-slate-600">Reguläre Beendigung</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">Beendigungsgründe · Anzahl</p>
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
            <span className="text-[11px] leading-snug text-slate-600">{row.label}</span>
            <span className="shrink-0 text-sm font-semibold text-[#1a3352]">
              {demoMode ? formatNumber(row.count) : "—"}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-center text-[11px] text-slate-500">Daten aus BASIS-Web</p>
    </article>
  );
}
