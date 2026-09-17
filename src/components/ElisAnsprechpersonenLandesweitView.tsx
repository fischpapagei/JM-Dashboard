import { useMemo, type RefObject } from 'react';
import { demoOperational } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay } from '../utils/periods';
import { overlayStoredAnsprechpersonen } from '../utils/elisJvaForm';
import { elisLastChangeLabel, getElisLastChange } from '../utils/elisLastChange';
import { buildElisAnsprechpersonenTable } from '../utils/elisAnsprechpersonen';
import { exportElisAnsprechpersonenExcel } from '../utils/exportBerichteExcel';
import { EmptyState } from './EmptyState';
import { ExcelExportButton } from './ExcelExportButton';
import { KurzberichtButton } from './KurzberichtButton';
import { ElisAnsprechpersonenTableView } from './ElisAnsprechpersonenTables';

interface ElisAnsprechpersonenLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
}

export function ElisAnsprechpersonenLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
}: ElisAnsprechpersonenLandesweitViewProps) {
  const lastChange = elisLastChangeLabel(getElisLastChange());
  const table = useMemo(() => {
    if (!demoMode) return null;
    const base = buildElisAnsprechpersonenTable(demoOperational, berichtszeitpunkt);
    return base ? overlayStoredAnsprechpersonen(base) : null;
  }, [berichtszeitpunkt, demoMode]);

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Elis_Ansprechpersonen_${table?.period ?? berichtszeitpunkt}.pdf`,
    });
  };

  const handleExcel = () => {
    if (!table) {
      throw new Error('Keine Ansprechpersonen zum Excel-Export.');
    }
    exportElisAnsprechpersonenExcel({
      meta: {
        reportLabel: 'Bericht 12',
        title: 'elis Ansprechpersonen',
        berichtszeitpunkt,
        extra: `Stand ${table.standLabel}${lastChange ? ` · ${lastChange}` : ''}`,
        filenameBase: `Elis_Ansprechpersonen_${table.period}`,
      },
      table,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">elis Ansprechpersonen</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 12
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
            {table ? ` · Stand ${table.standLabel}` : ''}
            {lastChange ? ` · ${lastChange}` : ''}
          </p>
          <p className="mt-1 text-sm font-medium text-nachtblau">
            Nur auf Ebene Ministerium (inkl. FB Päd.) abrufbar
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
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später aus der eLis-Erfassung."
        />
      ) : !table ? (
        <EmptyState
          title="Keine eLis-Ansprechpersonen"
          description="Für den ausgewählten Zeitraum liegen keine Ansprechpersonen vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-6">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Übersicht der eLis-Ansprechpersonen je Anstalt: Rektorin/Rektor, Sicherheitsrahmen und
              Sicherheitspartner
              {lastChange ? ` (${lastChange})` : ''}.
            </p>
          </div>
          <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2400">
            <ElisAnsprechpersonenTableView table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
