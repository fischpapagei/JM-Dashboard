import type { ReactNode } from "react";
import {
  DASHBOARD_AREAS,
  areaHasFreiePlaetze,
  getFreiePlaetzeKey,
  getHubKey,
  isDashboardAreaSection,
} from "../data/dashboardAreas";
import type { AuthUser } from "../types/auth";
import type { DashboardAreaKey, NavView } from "../types/domain";
import { JustizSidebar } from "../ui/JustizSidebar";
import { KernButton, KernText } from "../ui/kern";

interface SidebarLayoutProps {
  user: AuthUser;
  activeNav: NavView;
  jvaAreaContext: DashboardAreaKey | null;
  expandedAreas: Record<DashboardAreaKey, boolean>;
  onToggleArea: (areaKey: DashboardAreaKey) => void;
  onNav: (nav: NavView) => void;
  onNavAreaNrw: (areaKey: DashboardAreaKey) => void;
  onNavAreaJva: (areaKey: DashboardAreaKey) => void;
  onNavAreaFreiePlaetze: (areaKey: DashboardAreaKey) => void;
  onBackToLanding: () => void;
  onLogout: () => void;
  children: ReactNode;
  showDashboardNav?: boolean;
}

export function SidebarLayout({
  user,
  activeNav,
  jvaAreaContext,
  expandedAreas,
  onToggleArea,
  onNav,
  onNavAreaNrw,
  onNavAreaJva,
  onNavAreaFreiePlaetze,
  onBackToLanding,
  onLogout,
  children,
  showDashboardNav = true,
}: SidebarLayoutProps) {
  const subItem = (label: string, active: boolean, onClick: () => void) => (
    <KernButton
      type="button"
      variant={active ? "primary" : "tertiary"}
      label={label}
      block
      className="justiz-sidebar__sub"
      onClick={onClick}
    />
  );

  return (
    <div className="flex min-h-screen">
      <JustizSidebar
        title="Kennzahlensystem"
        userName={user.displayName}
        onBackToLanding={onBackToLanding}
        onLogout={onLogout}
        note={
          <KernText size="small">
            Dashboard = Auswertung.
            <br />
            Eingabe erfolgt in BASIS-Web.
          </KernText>
        }
      >
        {showDashboardNav &&
          DASHBOARD_AREAS.map((area) => {
            const sectionActive = isDashboardAreaSection(activeNav, area.key, jvaAreaContext);
            const expanded = expandedAreas[area.key];

            return (
              <div key={area.key}>
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => onNav(getHubKey(area.key))}
                    className={`kern-btn kern-btn--block min-w-0 flex-1 ${
                      sectionActive ? "kern-btn--primary" : "kern-btn--tertiary"
                    }`}
                  >
                    <area.icon className="justiz-sidebar__lucide" aria-hidden />
                    <span className="kern-label">{area.sidebarLabel}</span>
                  </button>
                  <KernButton
                    type="button"
                    variant="tertiary"
                    icon="arrow-down"
                    label=""
                    alt={`Untermenü ${area.sidebarLabel}`}
                    aria-expanded={expanded}
                    className="justiz-sidebar__icon-btn"
                    onClick={() => onToggleArea(area.key)}
                  />
                </div>
                {expanded ? (
                  <div className="mt-1 flex flex-col gap-1">
                    {subItem("NRW gesamt", activeNav === area.key, () => onNavAreaNrw(area.key))}
                    {areaHasFreiePlaetze(area.key) &&
                      subItem(
                        "Landesweit freie Plätze",
                        activeNav === getFreiePlaetzeKey(area.key),
                        () => onNavAreaFreiePlaetze(area.key),
                      )}
                    {subItem(
                      "JVA-Stammdatenblatt",
                      activeNav === "jva" && jvaAreaContext === area.key,
                      () => onNavAreaJva(area.key),
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
      </JustizSidebar>
      <main className="flex-1 overflow-auto bg-(--color-main-bg)">{children}</main>
    </div>
  );
}
