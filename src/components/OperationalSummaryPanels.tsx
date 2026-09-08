import type { SchulischeBildungKpis } from "../utils/aggregations";
import { formatNumber } from "../utils/format";

type OperationalKpis = Pick<
  SchulischeBildungKpis,
  | "paedStellen"
  | "paedBesetzt"
  | "paedExtern"
  | "elisLernplaetze"
  | "elisMandantschaften"
  | "elisDigitaleSozialraeume"
  | "schulraeume"
  | "elisSchulraeume"
>;

interface OperationalSummaryPanelsProps {
  kpis: OperationalKpis;
  demoMode: boolean;
  scopeLabel?: string;
  onPersonalClick?: () => void;
  onSchulraeumeClick?: () => void;
}

export function OperationalSummaryPanels({
  kpis,
  demoMode,
  scopeLabel,
  onPersonalClick,
  onSchulraeumeClick,
}: OperationalSummaryPanelsProps) {
  const show = (value: number | null) => (demoMode ? formatNumber(value) : "—");

  const panelClass =
    "rounded-xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-4 shadow-md shadow-emerald-900/20";

  const personalPanelClass = [
    panelClass,
    onPersonalClick
      ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-200/80"
      : "",
  ].join(" ");

  const schulraeumePanelClass = [
    panelClass,
    onSchulraeumeClick
      ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-200/80"
      : "",
  ].join(" ");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section
        className={personalPanelClass}
        role={onPersonalClick ? "button" : undefined}
        tabIndex={onPersonalClick ? 0 : undefined}
        onClick={onPersonalClick}
        onKeyDown={(e) => {
          if (!onPersonalClick) return;
          if (e.key === "Enter" || e.key === " ") onPersonalClick();
        }}
      >
        <h3 className="text-sm font-semibold text-emerald-50">Personal (pädagogischer Dienst)</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-emerald-100/90">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-emerald-50/95">Stellen: {show(kpis.paedStellen)}</p>
        <p className="text-xs font-medium text-emerald-50/95">Besetzt: {show(kpis.paedBesetzt)}</p>
        <p className="text-xs font-medium text-emerald-50/95">Externe Kräfte: {show(kpis.paedExtern)}</p>
      </section>
      <section
        className={schulraeumePanelClass}
        role={onSchulraeumeClick ? "button" : undefined}
        tabIndex={onSchulraeumeClick ? 0 : undefined}
        onClick={onSchulraeumeClick}
        onKeyDown={(e) => {
          if (!onSchulraeumeClick) return;
          if (e.key === "Enter" || e.key === " ") onSchulraeumeClick();
        }}
      >
        <h3 className="text-sm font-semibold text-emerald-50">Schulräume</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-emerald-100/90">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-emerald-50/95">Schulräume: {show(kpis.schulraeume)}</p>
        <p className="text-xs font-medium text-emerald-50/95">davon eLis Schulräume: {show(kpis.elisSchulraeume)}</p>
      </section>
      <section className={panelClass}>
        <h3 className="text-sm font-semibold text-emerald-50">eLis</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-emerald-100/90">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-emerald-50/95">Lernplätze: {show(kpis.elisLernplaetze)}</p>
        <p className="text-xs font-medium text-emerald-50/95">Mandantschaften: {show(kpis.elisMandantschaften)}</p>
        <p className="text-xs font-medium text-emerald-50/95">Digitale Sozialräume: {show(kpis.elisDigitaleSozialraeume)}</p>
      </section>
    </div>
  );
}
