import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboardArea, isDashboardNav } from "../data/dashboardAreas";
import { JVAS } from "../data/jvas";
import type { DashboardAreaKey, DashboardFilters, NavView } from "../types/domain";
import { DEFAULT_DASHBOARD_FILTERS, withOrganizationLevel } from "../utils/filters";
import { DashboardAreaHub } from "./DashboardAreaHub";
import { DemoModeToggle } from "./DemoModeToggle";
import { JvaDetail } from "./JvaDetail";
import { Layout } from "./Layout";
import { LoginPage } from "./LoginPage";
import { NrwOverview } from "./NrwOverview";
import { SidebarLayout } from "./SidebarLayout";

export function ProtectedApp() {
  const { user, isAuthenticated, logout } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [nav, setNav] = useState<NavView>("schulische-bildung-hub");
  const [jvaId, setJvaId] = useState<string>(JVAS[0]?.id ?? "");
  const [jvaAreaContext, setJvaAreaContext] = useState<DashboardAreaKey | null>(null);
  const [schulischeBildungExpanded, setSchulischeBildungExpanded] = useState(true);

  const isMinistry = user?.role === "ministry";
  const isJvaRole = user?.role === "jva";

  useEffect(() => {
    if (!user) return;
    if (isJvaRole && user.jvaId) {
      setJvaId(user.jvaId);
      setNav("jva");
      setJvaAreaContext(null);
      setFilters((f) => withOrganizationLevel(f, "jva", user.jvaId ?? null));
    }
  }, [user, isJvaRole]);

  const handleNav = useCallback((next: NavView) => {
    if (next === "jva") {
      setJvaAreaContext(null);
    }
    if (next === "schulische-bildung-hub" || next === "schulische-bildung") {
      setSchulischeBildungExpanded(true);
    }
    setNav(next);
  }, []);

  const handleNavSchulischeBildungJva = useCallback(() => {
    setJvaAreaContext("schulische-bildung");
    setSchulischeBildungExpanded(true);
    setNav("jva");
    setFilters((f) => withOrganizationLevel(f, "jva", jvaId));
  }, [jvaId]);

  const handleSelectNrwFromHub = useCallback(() => {
    setNav("schulische-bildung");
    setSchulischeBildungExpanded(true);
    setFilters((f) => withOrganizationLevel(f, "nrw", null));
  }, []);

  const handleSelectJvaFromHub = useCallback(() => {
    handleNavSchulischeBildungJva();
  }, [handleNavSchulischeBildungJva]);

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const dashboardArea = isDashboardNav(nav) ? getDashboardArea(nav) : null;
  const schulischeArea = getDashboardArea("schulische-bildung");

  let title = dashboardArea?.title ?? "JVA-Stammdatenblatt";
  let subtitle =
    dashboardArea?.subtitle ??
    "Anstaltsbezogene Kennzahlen mit NRW-Vergleich";

  if (nav === "schulische-bildung-hub") {
    title = `Übersicht · ${schulischeArea.sidebarLabel}`;
    subtitle = "Auswahl zwischen Landesdashboard und JVA-Stammdatenblatt";
  } else if (nav === "jva" && jvaAreaContext === "schulische-bildung") {
    title = `JVA-Stammdatenblatt · ${schulischeArea.sidebarLabel}`;
    subtitle = "Anstaltsbezogene Kennzahlen zur schulischen Bildung mit NRW-Vergleich";
  }

  return (
    <SidebarLayout
      user={user}
      activeNav={nav}
      jvaAreaContext={jvaAreaContext}
      schulischeBildungExpanded={schulischeBildungExpanded}
      onToggleSchulischeBildung={() => setSchulischeBildungExpanded((open) => !open)}
      onNav={handleNav}
      onNavSchulischeBildungJva={handleNavSchulischeBildungJva}
      onLogout={logout}
      showDashboardNav={isMinistry}
    >
      <Layout title={title} subtitle={subtitle} demoMode={demoMode} demoSlot={<DemoModeToggle enabled={demoMode} onChange={setDemoMode} />}>
        {nav === "schulische-bildung-hub" && isMinistry && (
          <DashboardAreaHub
            areaKey="schulische-bildung"
            onSelectNrw={handleSelectNrwFromHub}
            onSelectJva={handleSelectJvaFromHub}
          />
        )}
        {isDashboardNav(nav) && isMinistry && (
          <NrwOverview
            filters={filters}
            onFiltersChange={setFilters}
            demoMode={demoMode}
            onNavigateDashboard={handleNav}
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
            schulischeBildungContext={jvaAreaContext === "schulische-bildung"}
          />
        )}
      </Layout>
    </SidebarLayout>
  );
}
