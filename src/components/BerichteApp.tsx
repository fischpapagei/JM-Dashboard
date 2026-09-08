import { ArrowLeft, CheckCircle2, Clock, FileDown, LogOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReportByKey, getReportsForRole, isInlinePreviewReport, type ReportDefinition, type ReportKey } from '../data/reports';
import { JVAS } from '../data/jvas';
import type { KennzahlenLaunchContext, LandesweitReportVariant, BerichtAltersgruppeFilter } from '../types/app';
import { BERICHT_ALTERSGRUPPE_OPTIONS, LANDESWEIT_REPORT_VARIANT_LABELS } from '../types/app';
import {
  ENTWICKLUNG_ZEITRAUM_OPTIONS,
  getBerichtszeitpunktOptions,
  getCompletedQuarterOptions,
  getDefaultBerichtszeitpunkt,
  berichtszeitpunktToReportingPeriod,
  LATEST_COMPLETED_QUARTER,
  type EntwicklungZeitraum,
} from '../utils/periods';
import { LATEST_PERIOD, REPORTING_PERIODS } from '../utils/periods';
import { SchulteilnehmendeLandesweitView } from './SchulteilnehmendeLandesweitView';
import { AuslastungsquoteLandesweitView } from './AuslastungsquoteLandesweitView';
import { BeendigungsgruendeLandesweitView } from './BeendigungsgruendeLandesweitView';
import { SchulabschluesseLandesweitView } from './SchulabschluesseLandesweitView';
import { KursangeboteLandesweitView } from './KursangeboteLandesweitView';
import { SollplatzVeraenderungView } from './SollplatzVeraenderungView';
import { SchulraeumeLandesweitView } from './SchulraeumeLandesweitView';
import { StellenLandesweitView } from './StellenLandesweitView';
import { ElisRaumeLandesweitView } from './ElisRaumeLandesweitView';

interface BerichteAppProps {
  onBackToLanding: () => void;
  onLogout: () => void;
  onLaunchReport: (context: KennzahlenLaunchContext) => void;
}

function formatPeriodLabel(period: string): string {
  const match = period.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return period;
  return `${match[1]} · Quartal ${match[2]}`;
}

export function BerichteApp({ onBackToLanding, onLogout, onLaunchReport }: BerichteAppProps) {
  const { user } = useAuth();
  const reports = useMemo(() => (user ? getReportsForRole(user.role) : []), [user]);

  const [selectedKey, setSelectedKey] = useState<ReportKey | null>(
    reports[0]?.key ?? null,
  );
  const [reportingPeriod, setReportingPeriod] = useState<string>(LATEST_PERIOD);
  const [jvaId, setJvaId] = useState<string>(user?.jvaId ?? JVAS[0]?.id ?? '');
  const [demoMode, setDemoMode] = useState(true);
  const [landesweitReportVariant, setLandesweitReportVariant] =
    useState<LandesweitReportVariant>('entwicklung');
  const [altersgruppe, setAltersgruppe] = useState<BerichtAltersgruppeFilter>('alle');
  const [entwicklungZeitraum, setEntwicklungZeitraum] =
    useState<EntwicklungZeitraum>('last-5-quarters');
  const [berichtszeitpunkt, setBerichtszeitpunkt] = useState<string>(
    getDefaultBerichtszeitpunkt('last-5-quarters'),
  );
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const inlineExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedKey && getReportByKey(selectedKey)) return;
    setSelectedKey(reports[0]?.key ?? null);
  }, [reports, selectedKey]);

  const selectedReport = selectedKey ? getReportByKey(selectedKey) : undefined;

  if (!user) return null;

  const isJvaRole = user.role === 'jva';
  const effectiveJvaId = isJvaRole && user.jvaId ? user.jvaId : jvaId;

  if (showInlinePreview && selectedKey && isInlinePreviewReport(selectedKey)) {
    return (
      <div className="min-h-screen bg-[#eef1f6]">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Justiz NRW</p>
              <h1 className="truncate text-lg font-semibold text-[#1a3352]">Berichte</h1>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Abmelden
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-6 py-8">
          {selectedKey === 'elis-raeume-mandantschaften' ? (
            <ElisRaumeLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
            />
          ) : selectedKey === 'stellen-landesweit' ? (
            <StellenLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
            />
          ) : selectedKey === 'schulraeume-landesweit' ? (
            <SchulraeumeLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
            />
          ) : selectedKey === 'sollplaetze-veraenderung' ? (
            <SollplatzVeraenderungView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
            />
          ) : selectedKey === 'kursangebote-landesweit' ? (
            <KursangeboteLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
              showExternalColumn={user.role === 'ministry'}
            />
          ) : selectedKey === 'schulabschluesse-landesweit' || selectedKey === 'schulabschluesse-jva' ? (
            <SchulabschluesseLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
              jvaId={selectedKey === 'schulabschluesse-jva' ? effectiveJvaId : undefined}
            />
          ) : selectedKey === 'beendigungsgruende-landesweit' || selectedKey === 'beendigungsgruende-jva' ? (
            <BeendigungsgruendeLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
              jvaId={selectedKey === 'beendigungsgruende-jva' ? effectiveJvaId : undefined}
            />
          ) : selectedKey === 'auslastungsquote-landesweit' || selectedKey === 'auslastungsquote-jva' ? (
            <AuslastungsquoteLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
              jvaId={selectedKey === 'auslastungsquote-jva' ? effectiveJvaId : undefined}
            />
          ) : (
            <SchulteilnehmendeLandesweitView
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              onBack={() => setShowInlinePreview(false)}
              jvaId={selectedKey === 'schulteilnehmende-jva' ? effectiveJvaId : undefined}
            />
          )}
        </main>
      </div>
    );
  }

  const handleLaunch = () => {
    if (!selectedReport || selectedReport.status !== 'available') return;
    if (isInlinePreviewReport(selectedReport.key)) {
      setShowInlinePreview(true);
      return;
    }

    const context: KennzahlenLaunchContext = {
      areaKey: selectedReport.areaKey,
      reportingPeriod,
      demoMode,
      nav: selectedReport.scope === 'nrw' ? selectedReport.areaKey : 'jva',
      ...(selectedReport.scope === 'jva' ? { jvaId: effectiveJvaId } : {}),
      ...(selectedReport.key === 'schulischer-bildungsbericht-landesweit'
        ? {
            landesweitReportVariant,
            altersgruppe,
            ...(landesweitReportVariant === 'entwicklung'
              ? {
                  entwicklungZeitraum,
                  berichtszeitpunkt,
                  reportingPeriod: berichtszeitpunktToReportingPeriod(
                    berichtszeitpunkt,
                    entwicklungZeitraum,
                  ),
                }
              : {}),
          }
        : {}),
    };

    onLaunchReport(context);
  };

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Startseite
            </button>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Justiz NRW</p>
              <h1 className="truncate text-lg font-semibold text-[#1a3352]">Berichte</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <p className="hidden text-sm text-slate-600 sm:block">{user.displayName}</p>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#1a3352]">Berichte erstellen und konfigurieren</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Wählen Sie einen Berichtstyp, legen Sie den Zeitraum fest und erzeugen Sie den Bericht.
            Der Schulische Bildungsbericht öffnet die Auswertung im Kennzahlensystem; Schulteilnehmende
            und Auslastungsquote erscheinen als eigene Vorschau.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Berichtstypen
            </h3>
            {reports.map((report) => (
              <ReportTypeCard
                key={report.key}
                report={report}
                selected={selectedKey === report.key}
                onSelect={() => {
                  setShowInlinePreview(false);
                  setSelectedKey(report.key);
                  if (isInlinePreviewReport(report.key)) {
                    setBerichtszeitpunkt(LATEST_COMPLETED_QUARTER);
                  }
                }}
              />
            ))}
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            {selectedReport ? (
              <ReportConfiguration
                report={selectedReport}
                reportingPeriod={reportingPeriod}
                onReportingPeriodChange={setReportingPeriod}
                jvaId={effectiveJvaId}
                onJvaIdChange={setJvaId}
                showJvaSelect={selectedReport.scope === 'jva' && !isJvaRole}
                demoMode={demoMode}
                onDemoModeChange={setDemoMode}
                landesweitReportVariant={landesweitReportVariant}
                onLandesweitReportVariantChange={setLandesweitReportVariant}
                altersgruppe={altersgruppe}
                onAltersgruppeChange={setAltersgruppe}
                entwicklungZeitraum={entwicklungZeitraum}
                onEntwicklungZeitraumChange={setEntwicklungZeitraum}
                berichtszeitpunkt={berichtszeitpunkt}
                onBerichtszeitpunktChange={setBerichtszeitpunkt}
                onLaunch={handleLaunch}
                onShowInlinePreview={() => {
                  setBerichtszeitpunkt((current) =>
                    getCompletedQuarterOptions().some((option) => option.value === current)
                      ? current
                      : LATEST_COMPLETED_QUARTER,
                  );
                  setShowInlinePreview(true);
                }}
              />
            ) : (
              <p className="text-sm text-slate-500">Bitte einen Berichtstyp auswählen.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ReportTypeCard({
  report,
  selected,
  onSelect,
}: {
  report: ReportDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAvailable = report.status === 'available';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-xl border p-4 text-left transition',
        selected
          ? 'border-[#2d5a8e]/50 bg-[#2d5a8e]/5 shadow-sm ring-1 ring-[#2d5a8e]/20'
          : 'border-slate-200/80 bg-white shadow-sm hover:border-[#2d5a8e]/30 hover:shadow-md',
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#1a3352]">{report.title}</h4>
        {isAvailable ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Verfügbar
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            <Clock className="h-3 w-3" aria-hidden />
            Geplant
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-slate-600">{report.description}</p>
    </button>
  );
}

function ReportConfiguration({
  report,
  reportingPeriod,
  onReportingPeriodChange,
  jvaId,
  onJvaIdChange,
  showJvaSelect,
  demoMode,
  onDemoModeChange,
  landesweitReportVariant,
  onLandesweitReportVariantChange,
  altersgruppe,
  onAltersgruppeChange,
  entwicklungZeitraum,
  onEntwicklungZeitraumChange,
  berichtszeitpunkt,
  onBerichtszeitpunktChange,
  onLaunch,
  onShowInlinePreview,
}: {
  report: ReportDefinition;
  reportingPeriod: string;
  onReportingPeriodChange: (value: string) => void;
  jvaId: string;
  onJvaIdChange: (value: string) => void;
  showJvaSelect: boolean;
  demoMode: boolean;
  onDemoModeChange: (value: boolean) => void;
  landesweitReportVariant: LandesweitReportVariant;
  onLandesweitReportVariantChange: (value: LandesweitReportVariant) => void;
  altersgruppe: BerichtAltersgruppeFilter;
  onAltersgruppeChange: (value: BerichtAltersgruppeFilter) => void;
  entwicklungZeitraum: EntwicklungZeitraum;
  onEntwicklungZeitraumChange: (value: EntwicklungZeitraum) => void;
  berichtszeitpunkt: string;
  onBerichtszeitpunktChange: (value: string) => void;
  onLaunch: () => void;
  onShowInlinePreview: () => void;
}) {
  const isAvailable = report.status === 'available';
  const isLandesweitReport = report.key === 'schulischer-bildungsbericht-landesweit';
  const isInlinePreview = isInlinePreviewReport(report.key);
  const isEntwicklungReport = isLandesweitReport && landesweitReportVariant === 'entwicklung';
  const berichtszeitpunktOptions = useMemo(
    () =>
      isInlinePreview
        ? getCompletedQuarterOptions()
        : getBerichtszeitpunktOptions(entwicklungZeitraum),
    [entwicklungZeitraum, isInlinePreview],
  );

  useEffect(() => {
    if (!isEntwicklungReport && !isInlinePreview) return;
    const defaultValue = isInlinePreview
      ? LATEST_COMPLETED_QUARTER
      : getDefaultBerichtszeitpunkt(entwicklungZeitraum);
    const isValid = berichtszeitpunktOptions.some((option) => option.value === berichtszeitpunkt);
    if (!isValid) {
      onBerichtszeitpunktChange(defaultValue);
    }
  }, [
    berichtszeitpunkt,
    berichtszeitpunktOptions,
    entwicklungZeitraum,
    isEntwicklungReport,
    isInlinePreview,
    onBerichtszeitpunktChange,
  ]);
  const jvaOptions = useMemo(
    () => [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de-DE')),
    [],
  );

  const reportContents = useMemo(() => {
    if (!isLandesweitReport) return report.contents;

    if (landesweitReportVariant === 'jahresbericht') {
      return [
        'Aktive Filter und Berichtszeitraum',
        'Kennzahlenübersicht landesweit (tabellarisch)',
        'Vergleich nach JVA (Teilnehmende, Auslastung, freie Plätze)',
      ];
    }

    return [
      'Aktive Filter und Berichtszeitraum',
      'Kennzahlen (Teilnehmende, Beschäftigungsquote, Auslastung, Abschlüsse, Beendigungen)',
      'Kursangebote nach Hauptkategorie',
      'Entwicklung der Auslastungsquote',
      'Beendigungsgründe',
    ];
  }, [isLandesweitReport, landesweitReportVariant, report.contents]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1a3352]">{report.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{report.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLandesweitReport && (
          <>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-500">Berichtsausgabe</span>
              <select
                value={landesweitReportVariant}
                onChange={(event) =>
                  onLandesweitReportVariantChange(event.target.value as LandesweitReportVariant)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
              >
                {(Object.entries(LANDESWEIT_REPORT_VARIANT_LABELS) as [LandesweitReportVariant, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Altersgruppe</span>
              <select
                value={altersgruppe}
                onChange={(event) =>
                  onAltersgruppeChange(event.target.value as BerichtAltersgruppeFilter)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
              >
                {BERICHT_ALTERSGRUPPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {isInlinePreview && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-500">Berichtszeitpunkt</span>
            <select
              value={berichtszeitpunkt}
              onChange={(event) => onBerichtszeitpunktChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
            >
              {berichtszeitpunktOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Nur abgeschlossene Quartale. Der Verlauf wird rückwärts ab diesem Stichtag ausgewertet.
            </span>
          </label>
        )}

        {!isInlinePreview && (
          <>
            <label className={`block ${isEntwicklungReport ? 'sm:col-span-2' : ''}`}>
              <span className="mb-1 block text-xs font-medium text-slate-500">Berichtszeitraum</span>
              <select
                value={isEntwicklungReport ? entwicklungZeitraum : reportingPeriod}
                onChange={(event) => {
                  if (isEntwicklungReport) {
                    onEntwicklungZeitraumChange(event.target.value as EntwicklungZeitraum);
                    return;
                  }
                  onReportingPeriodChange(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
              >
                {isEntwicklungReport
                  ? ENTWICKLUNG_ZEITRAUM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  : REPORTING_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {formatPeriodLabel(period)}
                      </option>
                    ))}
              </select>
            </label>

            {isEntwicklungReport && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">Berichtszeitpunkt</span>
                <select
                  value={berichtszeitpunkt}
                  onChange={(event) => onBerichtszeitpunktChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
                >
                  {berichtszeitpunktOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Ausgabeformat</span>
          <select
            value="pdf"
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm"
          >
            <option value="pdf">PDF</option>
          </select>
        </label>

        {showJvaSelect && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-500">Justizvollzugsanstalt</span>
            <select
              value={jvaId}
              onChange={(event) => onJvaIdChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1a3352] shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
            >
              {jvaOptions.map((jva) => (
                <option key={jva.id} value={jva.id}>
                  {jva.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(event) => onDemoModeChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#2d5a8e] focus:ring-[#2d5a8e]/30"
          />
          <span className="text-sm text-slate-600">Demo-Daten für Vorschau und PDF-Erzeugung verwenden</span>
        </label>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Berichtsinhalt</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
          {reportContents.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        {isAvailable ? (
          <button
            type="button"
            onClick={isInlinePreview ? onShowInlinePreview : onLaunch}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a8e] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1a3352]"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            {isInlinePreview ? 'Bericht anzeigen' : 'Im Kennzahlensystem öffnen'}
          </button>
        ) : (
          <p className="text-sm text-amber-800">
            Dieser Berichtstyp ist noch in Vorbereitung und kann derzeit nicht erzeugt werden.
          </p>
        )}
        <p className="text-xs text-slate-500">
          {isInlinePreview
            ? 'Öffnet die Berichtsvorschau mit Grafiken. Dort kann das PDF erzeugt werden.'
            : isAvailable
              ? 'Öffnet die passende Auswertung mit vorausgewähltem Zeitraum. Dort „Kurzbericht erzeugen“ klicken.'
              : 'Dieser Bericht ist derzeit nicht verfügbar.'}
        </p>
      </div>
    </div>
  );
}
