import type { JvaTableRow } from '../types/domain';
import type { SchulischeBildungKpis } from '../utils/aggregations';
import { formatNumber, formatPercent } from '../utils/format';
import { EmptyState } from './EmptyState';

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
      <section className="kern-card kern-card--hug dashboard-panel overflow-hidden">
        <div className="border-b-2 border-(--color-border) px-4 py-3">
          <h3 className="kern-heading-small text-(--color-ink)">Kennzahlenübersicht</h3>
          <p className="kern-body kern-body--small text-(--color-muted)">Landesweite Kennzahlen für den Jahresbericht</p>
        </div>
        <div className="overflow-x-auto">
          <table className="kern-table kern-table--small kern-table--striped dashboard-table">
            <thead>
              <tr className="kern-table__row">
                <th className="kern-table__header">Kennzahl</th>
                <th className="kern-table__header">Wert</th>
              </tr>
            </thead>
            <tbody className="kern-table__body">
              {kpiRows.map((row) => (
                <tr key={row.kennzahl} className="kern-table__row">
                  <td className="kern-table__cell text-(--color-ink)">{row.kennzahl}</td>
                  <td className="kern-table__cell font-semibold">{row.wert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="kern-card kern-card--hug dashboard-panel overflow-hidden">
        <div className="border-b-2 border-(--color-border) px-4 py-3">
          <h3 className="kern-heading-small text-(--color-ink)">Vergleich nach JVA</h3>
          <p className="kern-body kern-body--small text-(--color-muted)">Tabellarische Aufschlüsselung aller Anstalten</p>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="kern-table kern-table--small kern-table--striped dashboard-table">
            <thead>
              <tr className="kern-table__row">
                <th className="kern-table__header">JVA</th>
                <th className="kern-table__header">Teilnehmende</th>
                <th className="kern-table__header">Soll-Plätze</th>
                <th className="kern-table__header">Auslastung</th>
                <th className="kern-table__header">Freie Plätze</th>
                <th className="kern-table__header">Beendigungen</th>
              </tr>
            </thead>
            <tbody className="kern-table__body">
              {jvaRows.length === 0 ? (
                <tr className="kern-table__row">
                  <td className="kern-table__cell" colSpan={6}>
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
                  <tr key={row.jvaId} className="kern-table__row">
                    <td className="kern-table__cell">{row.jvaName}</td>
                    <td className="kern-table__cell">{formatNumber(row.participants)}</td>
                    <td className="kern-table__cell">{formatNumber(row.targetPlaces)}</td>
                    <td className="kern-table__cell">{formatPercent(row.utilization)}</td>
                    <td className="kern-table__cell">{formatNumber(row.freePlaces)}</td>
                    <td className="kern-table__cell">{formatNumber(row.terminations)}</td>
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
