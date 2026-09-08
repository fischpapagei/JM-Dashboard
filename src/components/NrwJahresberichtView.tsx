import type { JvaTableRow } from '../types/domain';
import type { SchulischeBildungKpis } from '../utils/aggregations';
import { formatNumber, formatPercent } from '../utils/format';
import { EmptyState } from './EmptyState';
import { REPORT_DATA_CELL, REPORT_LABEL_CELL, REPORT_TABLE_CLASS } from './reportTableStyles';

interface NrwJahresberichtViewProps {
  kpis: SchulischeBildungKpis;
  jvaRows: JvaTableRow[];
  demoMode: boolean;
}

function formatMetric(value: number | null | undefined, isPercent = false): string {
  if (value == null) return '—';
  return isPercent ? formatPercent(value) : formatNumber(value);
}

export function NrwJahresberichtView({ kpis, jvaRows, demoMode }: NrwJahresberichtViewProps) {
  const kpiRows = [
    { kennzahl: 'Teilnehmende', wert: formatMetric(kpis.teilnehmende) },
    { kennzahl: 'Soll-Plätze', wert: formatMetric(kpis.sollPlaetze) },
    { kennzahl: 'Beschäftigungsquote gesamt', wert: formatMetric(kpis.beschaeftigungsquote, true) },
    {
      kennzahl: 'Bruttobelegung (belegbare Haftplätze)',
      wert: formatMetric(kpis.bruttobelegung, true),
    },
    {
      kennzahl: 'Beschäftigungsquote schulische Bildung',
      wert: formatMetric(kpis.schulischeBildung, true),
    },
    { kennzahl: 'Auslastungsquote schulische Maßnahmen', wert: formatMetric(kpis.auslastung, true) },
    { kennzahl: 'Erreichte Schulabschlüsse', wert: formatMetric(kpis.abschluesse) },
    {
      kennzahl: 'Anteil vorzeitige Beendigung',
      wert: formatMetric(kpis.anteilVorzeitigeBeendigung, true),
    },
    {
      kennzahl: 'Anteil reguläre Beendigung',
      wert: formatMetric(kpis.anteilRegulaereBeendigung, true),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-(--color-ink)">Kennzahlenübersicht</h3>
          <p className="mt-0.5 text-xs text-slate-500">Landesweite Kennzahlen für den Jahresbericht</p>
        </div>
        <div className="overflow-x-auto">
          <table className={`${REPORT_TABLE_CLASS} text-sm`}>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className={`${REPORT_LABEL_CELL} px-3`}>Kennzahl</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Wert</th>
              </tr>
            </thead>
            <tbody>
              {kpiRows.map((row) => (
                <tr key={row.kennzahl} className="border-t border-slate-100">
                  <td className={`${REPORT_LABEL_CELL} px-3 text-(--color-ink)`}>{row.kennzahl}</td>
                  <td className={`${REPORT_DATA_CELL} px-3 font-medium`}>{row.wert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-(--color-ink)">Vergleich nach JVA</h3>
          <p className="mt-0.5 text-xs text-slate-500">Tabellarische Aufschlüsselung aller Anstalten</p>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className={`${REPORT_TABLE_CLASS} text-sm`}>
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className={`${REPORT_LABEL_CELL} px-3`}>JVA</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Teilnehmende</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Soll-Plätze</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Auslastung</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Freie Plätze</th>
                <th className={`${REPORT_DATA_CELL} px-3`}>Beendigungen</th>
              </tr>
            </thead>
            <tbody>
              {jvaRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3">
                    <EmptyState
                      description={
                        demoMode
                          ? 'Keine Daten für aktuelle Filterauswahl.'
                          : 'Noch keine Kennzahlendaten geladen — Daten aus BASIS-Web'
                      }
                    />
                  </td>
                </tr>
              ) : (
                jvaRows.map((row) => (
                  <tr key={row.jvaId} className="border-t border-slate-100">
                    <td className={`${REPORT_LABEL_CELL} px-3`}>{row.jvaName}</td>
                    <td className={`${REPORT_DATA_CELL} px-3`}>{formatNumber(row.participants)}</td>
                    <td className={`${REPORT_DATA_CELL} px-3`}>{formatNumber(row.targetPlaces)}</td>
                    <td className={`${REPORT_DATA_CELL} px-3`}>{formatPercent(row.utilization)}</td>
                    <td className={`${REPORT_DATA_CELL} px-3`}>{formatNumber(row.freePlaces)}</td>
                    <td className={`${REPORT_DATA_CELL} px-3`}>{formatNumber(row.terminations)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
