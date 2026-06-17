import { Building2, ChevronDown, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { DASHBOARD_AREAS, isSchulischeBildungSection } from "../data/dashboardAreas";
import type { AuthUser } from "../types/auth";
import type { DashboardAreaKey, NavView } from "../types/domain";

interface SidebarLayoutProps {
  user: AuthUser;
  activeNav: NavView;
  jvaAreaContext: DashboardAreaKey | null;
  schulischeBildungExpanded: boolean;
  onToggleSchulischeBildung: () => void;
  onNav: (nav: NavView) => void;
  onNavSchulischeBildungJva: () => void;
  onLogout: () => void;
  children: ReactNode;
  showDashboardNav?: boolean;
}

export function SidebarLayout({
  user,
  activeNav,
  jvaAreaContext,
  schulischeBildungExpanded,
  onToggleSchulischeBildung,
  onNav,
  onNavSchulischeBildungJva,
  onLogout,
  children,
  showDashboardNav = true,
}: SidebarLayoutProps) {
  const schulischeArea = DASHBOARD_AREAS[0];
  const otherAreas = DASHBOARD_AREAS.slice(1);
  const schulischeSectionActive = isSchulischeBildungSection(activeNav, jvaAreaContext);

  const item = (id: NavView, label: string, Icon: (typeof DASHBOARD_AREAS)[number]["icon"]) => {
    const active = id === "jva" ? activeNav === "jva" && jvaAreaContext == null : activeNav === id;
    return (
      <button
        type="button"
        onClick={() => onNav(id)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          active ? "bg-[#2d5a8e] text-white" : "text-white/85 hover:bg-white/10"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {label}
      </button>
    );
  };

  const subItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full rounded-lg py-2 pl-11 pr-3 text-left text-sm transition-colors ${
        active ? "bg-[#2d5a8e] text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#1a3352] p-4 text-white">
        <div className="mb-8 px-1">
          <p className="text-xs uppercase tracking-wide text-white/60">Justiz NRW</p>
          <p className="text-sm font-semibold leading-tight">Kennzahlensystem</p>
          <p className="text-sm text-white/90">Bildung & Beschäftigung</p>
        </div>
        <nav className="space-y-1">
          {showDashboardNav && schulischeArea && (
            <div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNav("schulische-bildung-hub")}
                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    schulischeSectionActive ? "bg-[#2d5a8e] text-white" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  <schulischeArea.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate">{schulischeArea.sidebarLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleSchulischeBildung}
                  aria-expanded={schulischeBildungExpanded}
                  aria-label="Untermenü Schulische Bildung"
                  className={`rounded-lg p-2 transition-colors ${
                    schulischeSectionActive ? "text-white hover:bg-white/10" : "text-white/75 hover:bg-white/10"
                  }`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${schulischeBildungExpanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </div>
              {schulischeBildungExpanded && (
                <div className="mt-1 space-y-0.5">
                  {subItem("NRW gesamt", activeNav === "schulische-bildung", () => onNav("schulische-bildung"))}
                  {subItem(
                    "JVA-Stammdatenblatt",
                    activeNav === "jva" && jvaAreaContext === "schulische-bildung",
                    onNavSchulischeBildungJva,
                  )}
                </div>
              )}
            </div>
          )}
          {showDashboardNav && otherAreas.map((area) => item(area.key, area.sidebarLabel, area.icon))}
          {item("jva", "JVA-Stammdatenblatt", Building2)}
        </nav>
        <div className="flex-1" />
        <p className="mb-4 px-1 text-xs leading-relaxed text-white/60">
          Dashboard = Auswertung.
          <br />
          Eingabe erfolgt in BASIS-Web.
        </p>
        <div className="border-t border-white/20 pt-3">
          <p className="truncate text-xs text-white/75">{user.displayName}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex items-center gap-1 text-xs text-white/85 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[#eef1f6]">{children}</main>
    </div>
  );
}
