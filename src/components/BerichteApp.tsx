import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  audienceFromScope,
  getReportByKey,
  getReportsForRoleAndAudience,
  isInlinePreviewReport,
  type ReportAudience,
  type ReportDefinition,
  type ReportKey,
} from '../data/reports';
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
import { JustizSidebar } from '../ui/JustizSidebar';
import {
  KernAlert,
  KernBadge,
  KernButton,
  KernCard,
  KernCheckbox,
  KernColumn,
  KernHeading,
  KernList,
  KernRow,
  KernSelect,
  KernSpace,
  KernText,
} from '../ui/kern';

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

const AUDIENCE_COPY: Record<
  ReportAudience,
  { title: string; description: string; hint: string }
> = {
  jva: {
    title: 'JVA-Berichte',
    description:
      'Anstaltsbezogene Auswertungen für eine Justizvollzugsanstalt — inkl. NRW-Vergleich, sofern vorgesehen.',
    hint: 'Zu den JVA-Berichten',
  },
  ministry: {
    title: 'Ministeriumsberichte',
    description: 'Landesweite Berichte für das Justizministerium, FB Pädagogik und ZBI.',
    hint: 'Zu den Ministeriumsberichten',
  },
};

const DEFAULT_EXPANDED: Record<ReportAudience, boolean> = {
  jva: true,
  ministry: false,
};

export function BerichteApp({ onBackToLanding, onLogout, onLaunchReport }: BerichteAppProps) {
  const { user } = useAuth();
  const jvaReports = useMemo(
    () => (user ? getReportsForRoleAndAudience(user.role, 'jva') : []),
    [user],
  );
  const ministryReports = useMemo(
    () => (user ? getReportsForRoleAndAudience(user.role, 'ministry') : []),
    [user],
  );

  const [audience, setAudience] = useState<ReportAudience | null>(null);
  const [selectedKey, setSelectedKey] = useState<ReportKey | null>(null);
  const [expandedAudiences, setExpandedAudiences] = useState(DEFAULT_EXPANDED);
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

  const visibleReports = useMemo(() => {
    if (audience === 'jva') return jvaReports;
    if (audience === 'ministry') return ministryReports;
    return [];
  }, [audience, jvaReports, ministryReports]);

  useEffect(() => {
    if (!audience) {
      setSelectedKey(null);
      return;
    }
    if (selectedKey && visibleReports.some((report) => report.key === selectedKey)) return;
    setSelectedKey(visibleReports[0]?.key ?? null);
  }, [audience, selectedKey, visibleReports]);

  const selectedReport = selectedKey ? getReportByKey(selectedKey) : undefined;

  if (!user) return null;

  const isJvaRole = user.role === 'jva';
  const effectiveJvaId = isJvaRole && user.jvaId ? user.jvaId : jvaId;

  const selectAudience = (next: ReportAudience) => {
    setShowInlinePreview(false);
    setAudience(next);
    setExpandedAudiences((prev) => ({ ...prev, [next]: true }));
  };

  const selectReport = (report: ReportDefinition) => {
    const nextAudience = audienceFromScope(report.scope);
    setShowInlinePreview(false);
    setAudience(nextAudience);
    setExpandedAudiences((prev) => ({ ...prev, [nextAudience]: true }));
    setSelectedKey(report.key);
    if (isInlinePreviewReport(report.key)) {
      setBerichtszeitpunkt(LATEST_COMPLETED_QUARTER);
    }
  };

  const toggleAudience = (key: ReportAudience) => {
    setExpandedAudiences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const sidebarGroups: { key: ReportAudience; reports: ReportDefinition[] }[] = (
    [
      { key: 'jva' as const, reports: jvaReports },
      { key: 'ministry' as const, reports: ministryReports },
    ] satisfies { key: ReportAudience; reports: ReportDefinition[] }[]
  ).filter((group) => group.reports.length > 0);

  return (
    <div className="flex min-h-screen">
      <JustizSidebar
        title="Berichte"
        userName={user.displayName}
        onBackToLanding={onBackToLanding}
        onLogout={onLogout}
        note={
          <KernText size="small">
            Berichte = PDF-Konfiguration.
            <br />
            Auswertung im Kennzahlensystem.
          </KernText>
        }
      >
        <KernButton
          type="button"
          variant={audience === null ? 'primary' : 'tertiary'}
          icon="home"
          label="Übersicht"
          block
          onClick={() => {
            setAudience(null);
            setShowInlinePreview(false);
          }}
        />

        {sidebarGroups.map((group) => {
          const expanded = expandedAudiences[group.key];
          const sectionActive = audience === group.key;

          return (
            <div key={group.key}>
              <div className="flex items-stretch gap-1">
                <div className="min-w-0 flex-1">
                  <KernButton
                    type="button"
                    variant={sectionActive ? 'primary' : 'tertiary'}
                    label={AUDIENCE_COPY[group.key].title}
                    block
                    onClick={() => selectAudience(group.key)}
                  />
                </div>
                <KernButton
                  type="button"
                  variant="tertiary"
                  icon="arrow-down"
                  label=""
                  alt={`Untermenü ${AUDIENCE_COPY[group.key].title}`}
                  aria-expanded={expanded}
                  className="justiz-sidebar__icon-btn"
                  onClick={() => toggleAudience(group.key)}
                />
              </div>
              {expanded ? (
                <div className="mt-1 flex flex-col gap-1">
                  {group.reports.map((report) => (
                    <KernButton
                      key={report.key}
                      type="button"
                      variant={selectedKey === report.key ? 'primary' : 'tertiary'}
                      label={report.title}
                      block
                      className="justiz-sidebar__sub"
                      onClick={() => selectReport(report)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </JustizSidebar>

      <main className="flex-1 overflow-auto bg-(--color-main-bg)">
        {showInlinePreview && selectedKey && isInlinePreviewReport(selectedKey) ? (
          <div className="mx-auto max-w-[1600px] p-6">
            <BerichteInlinePreview
              selectedKey={selectedKey}
              berichtszeitpunkt={berichtszeitpunkt}
              demoMode={demoMode}
              exportRef={inlineExportRef}
              effectiveJvaId={effectiveJvaId}
              showExternalColumn={user.role === 'ministry'}
              onBack={() => setShowInlinePreview(false)}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-[1200px] p-6">
            {!audience ? (
              <ReportAudienceHub
                jvaCount={jvaReports.length}
                ministryCount={ministryReports.length}
                onSelect={selectAudience}
              />
            ) : selectedReport ? (
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
              <>
                <KernHeading level={1}>{AUDIENCE_COPY[audience].title}</KernHeading>
                <KernText>Bitte einen Berichtstyp in der Seitenleiste auswählen.</KernText>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function BerichteInlinePreview({
  selectedKey,
  berichtszeitpunkt,
  demoMode,
  exportRef,
  effectiveJvaId,
  showExternalColumn,
  onBack,
}: {
  selectedKey: ReportKey;
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  effectiveJvaId: string;
  showExternalColumn: boolean;
  onBack: () => void;
}) {
  if (selectedKey === 'elis-raeume-mandantschaften') {
    return (
      <ElisRaumeLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
      />
    );
  }
  if (selectedKey === 'stellen-landesweit') {
    return (
      <StellenLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
      />
    );
  }
  if (selectedKey === 'schulraeume-landesweit') {
    return (
      <SchulraeumeLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
      />
    );
  }
  if (selectedKey === 'sollplaetze-veraenderung') {
    return (
      <SollplatzVeraenderungView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
      />
    );
  }
  if (selectedKey === 'kursangebote-landesweit') {
    return (
      <KursangeboteLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
        showExternalColumn={showExternalColumn}
      />
    );
  }
  if (selectedKey === 'schulabschluesse-landesweit' || selectedKey === 'schulabschluesse-jva') {
    return (
      <SchulabschluesseLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
        jvaId={selectedKey === 'schulabschluesse-jva' ? effectiveJvaId : undefined}
      />
    );
  }
  if (selectedKey === 'beendigungsgruende-landesweit' || selectedKey === 'beendigungsgruende-jva') {
    return (
      <BeendigungsgruendeLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
        jvaId={selectedKey === 'beendigungsgruende-jva' ? effectiveJvaId : undefined}
      />
    );
  }
  if (selectedKey === 'auslastungsquote-landesweit' || selectedKey === 'auslastungsquote-jva') {
    return (
      <AuslastungsquoteLandesweitView
        berichtszeitpunkt={berichtszeitpunkt}
        demoMode={demoMode}
        exportRef={exportRef}
        onBack={onBack}
        jvaId={selectedKey === 'auslastungsquote-jva' ? effectiveJvaId : undefined}
      />
    );
  }
  return (
    <SchulteilnehmendeLandesweitView
      berichtszeitpunkt={berichtszeitpunkt}
      demoMode={demoMode}
      exportRef={exportRef}
      onBack={onBack}
      jvaId={selectedKey === 'schulteilnehmende-jva' ? effectiveJvaId : undefined}
    />
  );
}

function ReportAudienceHub({
  jvaCount,
  ministryCount,
  onSelect,
}: {
  jvaCount: number;
  ministryCount: number;
  onSelect: (audience: ReportAudience) => void;
}) {
  return (
    <>
      <KernHeading level={1}>Berichtsebene wählen</KernHeading>
      <KernText>
        Unterscheiden Sie zwischen anstaltsbezogenen JVA-Berichten und landesweiten
        Ministeriumsberichten.
      </KernText>
      <KernSpace size="large" />
      <KernRow>
        {jvaCount > 0 ? (
          <KernColumn sizes={{ xs: 12, md: jvaCount > 0 && ministryCount > 0 ? 6 : 12 }}>
            <AudienceCard audience="jva" count={jvaCount} onSelect={onSelect} />
          </KernColumn>
        ) : null}
        {ministryCount > 0 ? (
          <KernColumn sizes={{ xs: 12, md: jvaCount > 0 && ministryCount > 0 ? 6 : 12 }}>
            <AudienceCard audience="ministry" count={ministryCount} onSelect={onSelect} />
          </KernColumn>
        ) : null}
      </KernRow>
    </>
  );
}

function AudienceCard({
  audience,
  count,
  onSelect,
}: {
  audience: ReportAudience;
  count: number;
  onSelect: (audience: ReportAudience) => void;
}) {
  const copy = AUDIENCE_COPY[audience];
  return (
    <KernCard
      title={copy.title}
      subline={`${count} ${count === 1 ? 'Berichtstyp' : 'Berichtstypen'}`}
      footer={
        <KernButton
          type="button"
          variant="primary"
          label={copy.hint}
          onClick={() => onSelect(audience)}
        />
      }
    >
      {copy.description}
    </KernCard>
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
    <>
      <KernHeading level={1}>{report.title}</KernHeading>
      <KernText>{report.description}</KernText>
      <KernSpace size="small" />
      {isAvailable ? (
        <KernBadge label="Verfügbar" variant="success" />
      ) : (
        <KernBadge label="Geplant" variant="warning" />
      )}
      <KernSpace size="large" />
      <KernCard
        title="Konfiguration"
        subline="Zeitraum und Ausgabe"
        footer={
          isAvailable ? (
            <KernButton
              type="button"
              variant="primary"
              icon="download"
              label={isInlinePreview ? 'Bericht anzeigen' : 'Im Kennzahlensystem öffnen'}
              onClick={isInlinePreview ? onShowInlinePreview : onLaunch}
            />
          ) : undefined
        }
      >
        {isLandesweitReport ? (
          <>
            <KernSelect
              id="berichtsausgabe"
              label="Berichtsausgabe"
              value={landesweitReportVariant}
              onChange={(event) =>
                onLandesweitReportVariantChange(event.target.value as LandesweitReportVariant)
              }
            >
              {(
                Object.entries(LANDESWEIT_REPORT_VARIANT_LABELS) as [LandesweitReportVariant, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </KernSelect>
            <KernSpace size="default" />
            <KernSelect
              id="altersgruppe"
              label="Altersgruppe"
              value={altersgruppe}
              onChange={(event) =>
                onAltersgruppeChange(event.target.value as BerichtAltersgruppeFilter)
              }
            >
              {BERICHT_ALTERSGRUPPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </KernSelect>
            <KernSpace size="default" />
          </>
        ) : null}

        {isInlinePreview ? (
          <>
            <KernSelect
              id="berichtszeitpunkt"
              label="Berichtszeitpunkt"
              hint="Nur abgeschlossene Quartale. Der Verlauf wird rückwärts ab diesem Stichtag ausgewertet."
              value={berichtszeitpunkt}
              onChange={(event) => onBerichtszeitpunktChange(event.target.value)}
            >
              {berichtszeitpunktOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </KernSelect>
            <KernSpace size="default" />
          </>
        ) : (
          <>
            <KernSelect
              id="berichtszeitraum"
              label="Berichtszeitraum"
              value={isEntwicklungReport ? entwicklungZeitraum : reportingPeriod}
              onChange={(event) => {
                if (isEntwicklungReport) {
                  onEntwicklungZeitraumChange(event.target.value as EntwicklungZeitraum);
                  return;
                }
                onReportingPeriodChange(event.target.value);
              }}
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
            </KernSelect>
            <KernSpace size="default" />
            {isEntwicklungReport ? (
              <>
                <KernSelect
                  id="berichtszeitpunkt-entwicklung"
                  label="Berichtszeitpunkt"
                  value={berichtszeitpunkt}
                  onChange={(event) => onBerichtszeitpunktChange(event.target.value)}
                >
                  {berichtszeitpunktOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </KernSelect>
                <KernSpace size="default" />
              </>
            ) : null}
          </>
        )}

        <KernSelect id="ausgabeformat" label="Ausgabeformat" value="pdf" disabled>
          <option value="pdf">PDF</option>
        </KernSelect>
        <KernSpace size="default" />

        {showJvaSelect ? (
          <>
            <KernSelect
              id="jva"
              label="Justizvollzugsanstalt"
              value={jvaId}
              onChange={(event) => onJvaIdChange(event.target.value)}
            >
              {jvaOptions.map((jva) => (
                <option key={jva.id} value={jva.id}>
                  {jva.name}
                </option>
              ))}
            </KernSelect>
            <KernSpace size="default" />
          </>
        ) : null}

        <KernCheckbox
          id="demo-mode"
          name="demo-mode"
          label="Demo-Daten für Vorschau und PDF-Erzeugung verwenden"
          checked={demoMode}
          onChange={(event) => onDemoModeChange(event.target.checked)}
        />
      </KernCard>

      <KernSpace size="large" />
      <KernCard title="Berichtsinhalt" subline="Enthaltene Abschnitte">
        <KernList items={reportContents.map((content) => ({ content }))} />
      </KernCard>

      <KernSpace size="default" />
      {isAvailable ? (
        <KernText muted size="small">
          {isInlinePreview
            ? 'Öffnet die Berichtsvorschau mit Grafiken. Dort kann das PDF erzeugt werden.'
            : 'Öffnet die passende Auswertung mit vorausgewähltem Zeitraum. Dort „Kurzbericht erzeugen“ klicken.'}
        </KernText>
      ) : (
        <KernAlert title="Noch nicht verfügbar" variant="warning">
          Dieser Berichtstyp ist noch in Vorbereitung und kann derzeit nicht erzeugt werden.
        </KernAlert>
      )}
    </>
  );
}
