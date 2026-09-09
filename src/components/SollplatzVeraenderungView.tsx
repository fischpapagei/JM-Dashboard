import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay } from '../utils/periods';
import { buildSollplatzVeraenderungTable } from '../utils/sollplatzVeraenderung';
import { exportSollplatzVeraenderungExcel } from '../utils/exportBerichteExcel';
import { EmptyState } from './EmptyState';
import { ExcelExportButton } from './ExcelExportButton';
import { KurzberichtButton } from './KurzberichtButton';
import { SollplatzVeraenderungTableView } from './SollplatzVeraenderungTables';

interface SollplatzVeraenderungViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
}

export function SollplatzVeraenderungView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
}: SollplatzVeraenderungViewProps) {
  const table = useMemo(
    () => (demoMode ? buildSollplatzVeraenderungTable(demoRecords, berichtszeitpunkt) : null),
    [berichtszeitpunkt, demoMode],
  );

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    const stamp = table?.currentMonthKey ?? berichtszeitpunkt;
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Sollplaetze_Veraenderung_${stamp}.pdf`,
    });
  };

  const handleExcel = () => {
    if (!table || table.rows.length === 0) {
      throw new Error('Keine Kursänderungen zum Excel-Export.');
    }
    exportSollplatzVeraenderungExcel({
      meta: {
        reportLabel: 'Bericht 8',
        title: 'Veränderung der Schulkurse und deren Soll-Plätze',
        berichtszeitpunkt,
        extra: `${table.previousMonthLabel} → ${table.currentMonthLabel}`,
        filenameBase: `Sollplaetze_Veraenderung_${table.currentMonthKey}`,
      },
      table,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">
            Veränderung der Schulkurse und deren Soll-Plätze
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 8 · monatliche Kontrolle für FB Päd.
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
            {table ? ` · ${table.previousMonthLabel} → ${table.currentMonthLabel}` : ''}
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
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später automatisiert aus BASIS-Web."
        />
      ) : !table || table.rows.length === 0 ? (
        <EmptyState
          title="Keine Kursänderungen"
          description="Für den ausgewählten Monat liegen keine schulischen Kursangebote vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-6">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Monatlicher Abgleich der Soll-Plätze aus BASIS. Änderungen ohne Freigabe durch FB Päd. sollen
              erkennbar sein.
            </p>
            <p className="mt-1">
              <span className="font-medium text-red-600">Rot:</span> veränderte Soll-Plätze
              {' · '}
              <span className="font-medium text-emerald-700">Grün:</span> neu eingerichteter Kurs
              {' · '}
              <span className="font-medium text-(--color-ink)">Schwarz:</span> keine Veränderung
            </p>
          </div>
          <div
            data-pdf-block
            data-pdf-landscape
            data-pdf-multipage
            data-pdf-capture-width="2200"
          >
            <SollplatzVeraenderungTableView table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
