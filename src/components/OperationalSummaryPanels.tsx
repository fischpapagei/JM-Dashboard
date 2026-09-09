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
    "rounded border-2 p-4 text-white shadow-md";
  const personalPanelClass = [
    panelClass,
    "border-(--justiz-nachtblau) bg-(--justiz-nachtblau)",
    onPersonalClick
      ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
      : "",
  ].join(" ");

  const schulraeumePanelClass = [
    panelClass,
    "border-(--justiz-petrol) bg-(--justiz-petrol)",
    onSchulraeumeClick
      ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
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
        <h3 className="text-sm font-semibold text-white">Personal (pädagogischer Dienst)</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-white">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-white">Stellen: {show(kpis.paedStellen)}</p>
        <p className="text-xs font-medium text-white">Besetzt: {show(kpis.paedBesetzt)}</p>
        <p className="text-xs font-medium text-white">Externe Kräfte: {show(kpis.paedExtern)}</p>
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
        <h3 className="text-sm font-semibold text-white">Schulräume</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-white">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-white">Schulräume: {show(kpis.schulraeume)}</p>
        <p className="text-xs font-medium text-white">davon eLis Schulräume: {show(kpis.elisSchulraeume)}</p>
      </section>
      <section className={`${panelClass} border-(--justiz-gruen) bg-(--justiz-gruen)`}>
        <h3 className="text-sm font-semibold text-white">eLis</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-white">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium text-white">Lernplätze: {show(kpis.elisLernplaetze)}</p>
        <p className="text-xs font-medium text-white">Mandantschaften: {show(kpis.elisMandantschaften)}</p>
        <p className="text-xs font-medium text-white">Digitale Sozialräume: {show(kpis.elisDigitaleSozialraeume)}</p>
      </section>
    </div>
  );
}
