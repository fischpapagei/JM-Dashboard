import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  areaHasFreiePlaetze,
  getActiveAreaKey,
  getAreaFromFreiePlaetze,
  getAreaFromHub,
  getDashboardArea,
  getFreiePlaetzeKey,
  getHubKey,
  isDashboardHub,
  isDashboardNav,
  isFreiePlaetzeNav,
} from "../data/dashboardAreas";
import { getJvaById, JVAS } from "../data/jvas";
import type { KennzahlenLaunchContext, LandesweitReportVariant } from "../types/app";
import {
  getEntwicklungZeitraumGranularity,
  LATEST_PERIOD,
  type EntwicklungZeitraum,
} from "../utils/periods";
import type { DashboardAreaKey, DashboardFilters, NavView, TimeGranularity } from "../types/domain";
import { DEFAULT_DASHBOARD_FILTERS, withOrganizationLevel } from "../utils/filters";
import { AreaNrwDashboard } from "./AreaNrwDashboard";
import { DashboardAreaHub } from "./DashboardAreaHub";
import { DemoModeToggle } from "./DemoModeToggle";
import { JvaDetail } from "./JvaDetail";
import { LandesweitFreiePlaetze } from "./LandesweitFreiePlaetze";
import { Layout } from "./Layout";
import { SidebarLayout } from "./SidebarLayout";

const DEFAULT_EXPANDED_AREAS: Record<DashboardAreaKey, boolean> = {
  "schulische-bildung": true,
  "berufliche-bildung": false,
  "arbeit-arbeitstherapie": false,
  "beschaeftigungsquote": false,
};

interface ProtectedAppProps {
  launchContext?: KennzahlenLaunchContext | null;
  onLaunchContextConsumed?: () => void;
  onBackToLanding: () => void;
  onLogout: () => void;
}

export function ProtectedApp({
  launchContext = null,
  onLaunchContextConsumed,
  onBackToLanding,
  onLogout,
}: ProtectedAppProps) {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [nav, setNav] = useState<NavView>(getHubKey("schulische-bildung"));
  const [jvaId, setJvaId] = useState<string>(JVAS[0]?.id ?? "");
  const [jvaAreaContext, setJvaAreaContext] = useState<DashboardAreaKey | null>(null);
  const [expandedAreas, setExpandedAreas] = useState(DEFAULT_EXPANDED_AREAS);
  const [landesweitReportVariant, setLandesweitReportVariant] =
    useState<LandesweitReportVariant>("entwicklung");
  const [entwicklungZeitraum, setEntwicklungZeitraum] = useState<EntwicklungZeitraum | null>(null);
  const [berichtszeitpunkt, setBerichtszeitpunkt] = useState<string | null>(null);

  useEffect(() => {
    if (!launchContext) return;

    setDemoMode(launchContext.demoMode);
    setExpandedAreas((prev) => ({ ...prev, [launchContext.areaKey]: true }));
    if (launchContext.landesweitReportVariant) {
      setLandesweitReportVariant(launchContext.landesweitReportVariant);
    }
    if (launchContext.entwicklungZeitraum) {
      setEntwicklungZeitraum(launchContext.entwicklungZeitraum);
    } else {
      setEntwicklungZeitraum(null);
    }
    if (launchContext.berichtszeitpunkt) {
      setBerichtszeitpunkt(launchContext.berichtszeitpunkt);
    } else {
      setBerichtszeitpunkt(null);
    }

    const launchReportingPeriod = launchContext.reportingPeriod ?? LATEST_PERIOD;
    const launchTimeGranularity: TimeGranularity | undefined = launchContext.entwicklungZeitraum
      ? (getEntwicklungZeitraumGranularity(launchContext.entwicklungZeitraum) as TimeGranularity)
      : undefined;

    if (launchContext.nav === "jva") {
      const nextJvaId = launchContext.jvaId ?? JVAS[0]?.id ?? "";
      setJvaAreaContext(launchContext.areaKey);
      setJvaId(nextJvaId);
      setNav("jva");
      setFilters((current) =>
        withOrganizationLevel(
          {
            ...current,
            reportingPeriod: launchReportingPeriod,
            ...(launchContext.altersgruppe ? { altersgruppe: launchContext.altersgruppe } : {}),
            ...(launchTimeGranularity ? { timeGranularity: launchTimeGranularity } : {}),
          },
          "jva",
          [nextJvaId],
        ),
      );
    } else {
      setJvaAreaContext(null);
      setNav(launchContext.nav);
      setFilters((current) =>
        withOrganizationLevel(
          {
            ...current,
            reportingPeriod: launchReportingPeriod,
            ...(launchContext.altersgruppe ? { altersgruppe: launchContext.altersgruppe } : {}),
            ...(launchTimeGranularity ? { timeGranularity: launchTimeGranularity } : {}),
          },
          "nrw",
          [],
        ),
      );
    }

    onLaunchContextConsumed?.();
  }, [launchContext, onLaunchContextConsumed]);

  const isMinistry = user?.role === "ministry";
  const isJvaRole = user?.role === "jva";

  const expandArea = useCallback((areaKey: DashboardAreaKey) => {
    setExpandedAreas((prev) => ({ ...prev, [areaKey]: true }));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (isJvaRole && user.jvaId) {
      setJvaId(user.jvaId);
      setJvaAreaContext("schulische-bildung");
      setNav("jva");
      setFilters((f) => withOrganizationLevel(f, "jva", user.jvaId ? [user.jvaId] : []));
    }
  }, [user, isJvaRole]);

  const handleNav = useCallback(
    (next: NavView) => {
      if (next === "jva") {
        setJvaAreaContext(null);
      }
      const areaKey = getActiveAreaKey(next, jvaAreaContext);
      if (areaKey) {
        expandArea(areaKey);
      }
      setNav(next);
    },
    [expandArea, jvaAreaContext],
  );

  const handleNavAreaNrw = useCallback(
    (areaKey: DashboardAreaKey) => {
      expandArea(areaKey);
      setNav(areaKey);
      setFilters((f) => withOrganizationLevel(f, "nrw", []));
    },
    [expandArea],
  );

  const handleNavAreaJva = useCallback(
    (areaKey: DashboardAreaKey) => {
      setJvaAreaContext(areaKey);
      expandArea(areaKey);
      setNav("jva");
      setFilters((f) => withOrganizationLevel(f, "jva", [jvaId]));
    },
    [expandArea, jvaId],
  );

  const handleNavAreaFreiePlaetze = useCallback(
    (areaKey: DashboardAreaKey) => {
      if (!areaHasFreiePlaetze(areaKey)) return;
      expandArea(areaKey);
      setNav(getFreiePlaetzeKey(areaKey));
      setFilters((f) => withOrganizationLevel(f, "nrw", []));
    },
    [expandArea],
  );

  const handleSelectNrwFromHub = useCallback(
    (areaKey: DashboardAreaKey) => {
      handleNavAreaNrw(areaKey);
    },
    [handleNavAreaNrw],
  );

  const handleSelectJvaFromHub = useCallback(
    (areaKey: DashboardAreaKey) => {
      handleNavAreaJva(areaKey);
    },
    [handleNavAreaJva],
  );

  const handleSelectFreiePlaetzeFromHub = useCallback(
    (areaKey: DashboardAreaKey) => {
      handleNavAreaFreiePlaetze(areaKey);
    },
    [handleNavAreaFreiePlaetze],
  );

  const handleJvaChange = useCallback((nextJvaId: string) => {
    setJvaId(nextJvaId);
    setFilters((f) => withOrganizationLevel(f, "jva", [nextJvaId]));
  }, []);

  if (!user) return null;

  const activeAreaKey = getActiveAreaKey(nav, jvaAreaContext);
  const activeArea = activeAreaKey ? getDashboardArea(activeAreaKey) : null;

  let title = activeArea?.title ?? "JVA-Stammdatenblatt";
  let subtitle = activeArea?.subtitle ?? "Anstaltsbezogene Kennzahlen mit NRW-Vergleich";

  if (isDashboardHub(nav) && activeArea) {
    title = `Übersicht · ${activeArea.sidebarLabel}`;
    subtitle = "Auswahl zwischen Landesdashboard und JVA-Stammdatenblatt";
  } else if (isFreiePlaetzeNav(nav) && activeArea) {
    title = `Landesweit freie Plätze · ${activeArea.sidebarLabel}`;
    subtitle = "Tagesaktuelle freie Plätze landesweit nach Kursart und JVA";
  } else if (nav === "jva" && jvaAreaContext) {
    const selectedJva = getJvaById(isJvaRole && user.jvaId ? user.jvaId : jvaId);
    title = `JVA-Stammdatenblatt · ${getDashboardArea(jvaAreaContext).sidebarLabel}`;
    subtitle = selectedJva
      ? `${selectedJva.name} — Anstaltsbezogene Kennzahlen zu ${getDashboardArea(jvaAreaContext).sidebarLabel.toLowerCase()} mit NRW-Vergleich`
      : `Anstaltsbezogene Kennzahlen zu ${getDashboardArea(jvaAreaContext).sidebarLabel.toLowerCase()} mit NRW-Vergleich`;
  }

  return (
    <SidebarLayout
      user={user}
      activeNav={nav}
      jvaAreaContext={jvaAreaContext}
      expandedAreas={expandedAreas}
      onToggleArea={(areaKey) =>
        setExpandedAreas((prev) => ({ ...prev, [areaKey]: !prev[areaKey] }))
      }
      onNav={handleNav}
      onNavAreaNrw={handleNavAreaNrw}
      onNavAreaJva={handleNavAreaJva}
      onNavAreaFreiePlaetze={handleNavAreaFreiePlaetze}
      onBackToLanding={onBackToLanding}
      onLogout={onLogout}
      showDashboardNav={isMinistry}
    >
      <Layout title={title} subtitle={subtitle} demoMode={demoMode} demoSlot={<DemoModeToggle enabled={demoMode} onChange={setDemoMode} />}>
        {isDashboardHub(nav) && isMinistry && (
          <DashboardAreaHub
            areaKey={getAreaFromHub(nav)}
            onSelectNrw={() => handleSelectNrwFromHub(getAreaFromHub(nav))}
            onSelectFreiePlaetze={
              areaHasFreiePlaetze(getAreaFromHub(nav))
                ? () => handleSelectFreiePlaetzeFromHub(getAreaFromHub(nav))
                : undefined
            }
            onSelectJva={() => handleSelectJvaFromHub(getAreaFromHub(nav))}
          />
        )}
        {isDashboardNav(nav) && isMinistry && (
          <AreaNrwDashboard
            areaKey={nav}
            filters={filters}
            onFiltersChange={setFilters}
            demoMode={demoMode}
            onNavigateDashboard={handleNavAreaNrw}
            landesweitReportVariant={landesweitReportVariant}
            entwicklungZeitraum={entwicklungZeitraum}
            berichtszeitpunkt={berichtszeitpunkt}
          />
        )}
        {isFreiePlaetzeNav(nav) && isMinistry && (
          <LandesweitFreiePlaetze
            areaKey={getAreaFromFreiePlaetze(nav)}
            filters={filters}
            onFiltersChange={setFilters}
            demoMode={demoMode}
          />
        )}
        {isDashboardNav(nav) && isJvaRole && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Die Landesübersicht ist für Ihre JVA-Rolle nicht freigeschaltet. Bitte „JVA-Stammdatenblatt“ wählen.
          </p>
        )}
        {nav === "jva" && (
          <JvaDetail
            jvaId={isJvaRole && user.jvaId ? user.jvaId : jvaId}
            filters={filters}
            onFiltersChange={setFilters}
            demoMode={demoMode}
            isJvaRole={isJvaRole}
            dashboardAreaContext={jvaAreaContext}
            onJvaChange={isMinistry ? handleJvaChange : undefined}
          />
        )}
      </Layout>
    </SidebarLayout>
  );
}
