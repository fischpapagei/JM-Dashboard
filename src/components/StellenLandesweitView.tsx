import { useMemo, type RefObject } from 'react';
import { demoOperational } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay } from '../utils/periods';
import { buildStellenTable } from '../utils/stellen';
import { exportStellenExcel } from '../utils/exportBerichteExcel';
import { EmptyState } from './EmptyState';
import { ExcelExportButton } from './ExcelExportButton';
import { KurzberichtButton } from './KurzberichtButton';
import { StellenTableView } from './StellenTables';

interface StellenLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
}

export function StellenLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
}: StellenLandesweitViewProps) {
  const table = useMemo(
    () => (demoMode ? buildStellenTable(demoOperational, berichtszeitpunkt) : null),
    [berichtszeitpunkt, demoMode],
  );

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Stellen_paedagogischer_Dienst_${table?.period ?? berichtszeitpunkt}.pdf`,
    });
  };

  const handleExcel = () => {
    if (!table) {
      throw new Error('Keine Stellendaten zum Excel-Export.');
    }
    exportStellenExcel({
      meta: {
        reportLabel: 'Bericht 10',
        title: 'Stellen',
        berichtszeitpunkt,
        extra: `Datenstand ${formatReportingPeriodDisplay(table.period)}`,
        filenameBase: `Stellen_paedagogischer_Dienst_${table.period}`,
      },
      table,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">Stellen</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 10 · Stellen pädagogischer Dienst
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
            {table ? ` · Datenstand ${formatReportingPeriodDisplay(table.period)}` : ''}
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
          <ExcelExportButton onExport={handleExcel} disabled={!demoMode} label="Excel erzeugen" />
          <KurzberichtButton onGenerate={handlePdf} disabled={!demoMode} label="PDF erzeugen" />
        </div>
      </div>

      {!demoMode ? (
        <EmptyState
          title="Keine Daten geladen"
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten hängen von der Lieferung der Stelleninformationen ab."
        />
      ) : !table ? (
        <EmptyState
          title="Keine Stellendaten"
          description="Für den ausgewählten Zeitraum liegen keine Stellen des pädagogischen Dienstes vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-6">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Übersicht der Stellen im pädagogischen Dienst je Anstalt. Im Produktivbetrieb nur, sofern die
              Stellendaten geliefert werden.
            </p>
          </div>
          <div data-pdf-block data-pdf-multipage>
            <StellenTableView table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
