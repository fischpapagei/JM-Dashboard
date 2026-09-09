import { useMemo, type RefObject } from 'react';
import { demoSchoolRooms } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay, getCompletedYearAsOf, getYearFromPeriod } from '../utils/periods';
import { buildSchulraumTable } from '../utils/schulraeume';
import { exportSchulraeumeExcel } from '../utils/exportBerichteExcel';
import { EmptyState } from './EmptyState';
import { ExcelExportButton } from './ExcelExportButton';
import { KurzberichtButton } from './KurzberichtButton';
import { SchulraeumeTable } from './SchulraeumeTables';

interface SchulraeumeLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
}

function standYear(berichtszeitpunkt: string): number {
  return (
    getCompletedYearAsOf(berichtszeitpunkt) ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10))
  );
}

export function SchulraeumeLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
}: SchulraeumeLandesweitViewProps) {
  const year = standYear(berichtszeitpunkt);
  const table = useMemo(() => (demoMode ? buildSchulraumTable(demoSchoolRooms) : null), [demoMode]);

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Schulraeume_landesweit_${year}.pdf`,
    });
  };

  const handleExcel = () => {
    if (!table || table.rows.length === 0) {
      throw new Error('Keine Schulräume zum Excel-Export.');
    }
    exportSchulraeumeExcel({
      meta: {
        reportLabel: 'Bericht 9',
        title: 'Schulräume',
        berichtszeitpunkt,
        extra: `Stand ${year}`,
        filenameBase: `Schulraeume_landesweit_${year}`,
      },
      year,
      table,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">Schulräume</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 9 · Übersicht der Schulräume · Stand {year}
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
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
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später aus der jährlichen Web-Erfassung der Anstalten."
        />
      ) : !table || table.rows.length === 0 ? (
        <EmptyState
          title="Keine Schulräume"
          description="Es liegen keine Schulraumdaten vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-6">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Jährliche Übersicht der Schulräume je Anstalt. Die Daten werden von den Anstalten jährlich im
              Webformular auf Aktualität geprüft und bei Bedarf geändert.
            </p>
            <p className="mt-1">
              Spalte eLis: 1 = ja, 0 = nein. Summenzeilen je JVA und Gesamtsumme über alle Anstalten.
            </p>
          </div>
          <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2000">
            <SchulraeumeTable table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
