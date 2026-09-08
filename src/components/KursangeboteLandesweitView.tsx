import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import { formatReportingPeriodDisplay } from '../utils/periods';
import {
  brochureYearFromBerichtszeitpunkt,
  buildKursangeboteSections,
} from '../utils/kursangebote';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { KursangeboteOfferTable } from './KursangeboteTables';

interface KursangeboteLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  showExternalColumn: boolean;
}

export function KursangeboteLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
  showExternalColumn,
}: KursangeboteLandesweitViewProps) {
  const year = brochureYearFromBerichtszeitpunkt(berichtszeitpunkt);
  const sections = useMemo(
    () => (demoMode ? buildKursangeboteSections(demoRecords, berichtszeitpunkt) : []),
    [berichtszeitpunkt, demoMode],
  );

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Kursangebote_landesweit_${year}.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">Kursangebote (landesweit)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bericht 7 · Bildungsbroschüre Teil 2 · Stand {year}
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
          <KurzberichtButton onGenerate={handlePdf} disabled={!demoMode} label="PDF erzeugen" />
        </div>
      </div>

      {!demoMode ? (
        <EmptyState
          title="Keine Daten geladen"
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später aus BASIS-Web und der jährlichen Web-Erfassung."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          title="Keine Kursangebote"
          description="Für das ausgewählte Jahr liegen keine aktiven schulischen Kursangebote vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-8">
          <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p>
              Jährliche Übersicht der aktiven schulischen Kursangebote, eine Sektion je Anstalt.
              Nur vorhandene Angebote werden angezeigt.
            </p>
            <p className="mt-1">
              <span className="font-medium text-sky-700">Blau:</span> BASIS (Kursname, SOLL-Plätze)
              {' · '}
              <span className="font-medium text-emerald-700">Grün:</span> jährliche Web-Erfassung
              {showExternalColumn ? (
                <>
                  {' · '}
                  <span className="font-medium text-violet-800">Violett:</span> nur JM, FB Päd. und ZBI
                </>
              ) : null}
            </p>
          </div>

          {sections.map((section) => (
            <section
              key={section.jvaId}
              data-pdf-block
              data-pdf-landscape
              data-pdf-multipage
              data-pdf-new-page
              data-pdf-capture-width="2200"
              className="space-y-4"
            >
              <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <h3 className="text-lg font-semibold text-(--color-ink)">{section.jvaName}</h3>
                <p className="text-xs text-slate-500">Schulisches Bildungsangebot · Stand {year}</p>
              </div>
              {section.tables.map((table) => (
                <KursangeboteOfferTable
                  key={table.key}
                  table={table}
                  showExternalColumn={showExternalColumn}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
