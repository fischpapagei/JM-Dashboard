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

  const panelClass = "rounded border p-4 shadow-sm";
  const personalPanelClass = [
    panelClass,
    "border-nachtblau bg-nachtblau text-white",
    onPersonalClick
      ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-nachtblau-50"
      : "",
  ].join(" ");

  const schulraeumePanelClass = [
    panelClass,
    "border-nachtblau-30 bg-nachtblau-15 text-nachtblau",
    onSchulraeumeClick
      ? "cursor-pointer transition hover:bg-nachtblau-30 focus:outline-none focus:ring-2 focus:ring-nachtblau"
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
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-white/80">{scopeLabel}</p>}
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
        <h3 className="text-sm font-semibold">Schulräume</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-nachtblau/80">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium">Schulräume: {show(kpis.schulraeume)}</p>
        <p className="text-xs font-medium">davon eLis Schulräume: {show(kpis.elisSchulraeume)}</p>
      </section>
      <section className={`${panelClass} border-nachtblau-50 bg-nachtblau-30 text-nachtblau`}>
        <h3 className="text-sm font-semibold">eLis</h3>
        {scopeLabel && <p className="mt-0.5 text-xs font-medium text-nachtblau/80">{scopeLabel}</p>}
        <p className="mt-2 text-xs font-medium">Lernplätze: {show(kpis.elisLernplaetze)}</p>
        <p className="text-xs font-medium">Mandantschaften: {show(kpis.elisMandantschaften)}</p>
        <p className="text-xs font-medium">Digitale Sozialräume: {show(kpis.elisDigitaleSozialraeume)}</p>
      </section>
    </div>
  );
}
