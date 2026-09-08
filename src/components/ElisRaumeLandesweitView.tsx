import { useMemo, type RefObject } from 'react';
import { demoOperational } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay } from '../utils/periods';
import { buildElisRaumeTable } from '../utils/elisRaume';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { ElisRaumeTableView } from './ElisRaumeTables';

interface ElisRaumeLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
}

export function ElisRaumeLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
}: ElisRaumeLandesweitViewProps) {
  const table = useMemo(
    () => (demoMode ? buildElisRaumeTable(demoOperational, berichtszeitpunkt) : null),
    [berichtszeitpunkt, demoMode],
  );

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Elis_Raeume_Mandantschaften_${table?.period ?? berichtszeitpunkt}.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1a3352]">elis Räume und Mandantschaften</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 11
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
            {table ? ` · Stand ${table.standLabel}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Zurück zur Konfiguration
          </button>
          <KurzberichtButton onGenerate={handlePdf} disabled={!demoMode} label="PDF erzeugen" />
        </div>
      </div>

      {!demoMode ? (
        <EmptyState
          title="Keine Daten geladen"
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später aus der eLis-Erfassung."
        />
      ) : !table ? (
        <EmptyState
          title="Keine eLis-Daten"
          description="Für den ausgewählten Zeitraum liegen keine eLis-Räume und Mandantschaften vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-6">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Übersicht der eLis-Mandantschaften, Schulräume und digitalen Sozialräume je Anstalt (elis-Verbund).
            </p>
          </div>
          <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2400">
            <ElisRaumeTableView table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
