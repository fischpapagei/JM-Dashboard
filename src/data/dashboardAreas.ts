import type { LucideIcon } from "lucide-react";
import { Briefcase, GraduationCap, Hammer, Percent } from "lucide-react";
import type { DashboardAreaKey, NavView } from "../types/domain";

export interface DashboardArea {
  key: DashboardAreaKey;
  sidebarLabel: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const DASHBOARD_AREAS: DashboardArea[] = [
  {
    key: "schulische-bildung",
    sidebarLabel: "Schulische Bildung",
    title: "Ministeriumsübersicht · Schulische Bildung",
    subtitle:
      "Landesweite Steuerung schulischer Bildung im Justizvollzug — Auswertung aus BASIS-Web",
    icon: GraduationCap,
  },
  {
    key: "berufliche-bildung",
    sidebarLabel: "Berufliche Bildung",
    title: "Ministeriumsübersicht · Berufliche Bildung",
    subtitle:
      "Landesweite Steuerung beruflicher Bildung im Justizvollzug — Auswertung aus BASIS-Web",
    icon: Briefcase,
  },
  {
    key: "arbeit-arbeitstherapie",
    sidebarLabel: "Arbeit und Arbeitstherapie",
    title: "Ministeriumsübersicht · Arbeit und Arbeitstherapie",
    subtitle:
      "Landesweite Steuerung von Arbeit und Arbeitstherapie im Justizvollzug — Auswertung aus BASIS-Web",
    icon: Hammer,
  },
  {
    key: "beschaeftigungsquote",
    sidebarLabel: "Beschäftigungsquote",
    title: "Ministeriumsübersicht · Beschäftigungsquote",
    subtitle:
      "Landesweite Beschäftigungsquoten im Justizvollzug — Auswertung aus BASIS-Web",
    icon: Percent,
  },
];

export function isDashboardNav(nav: NavView): nav is DashboardAreaKey {
  return nav !== 'jva' && nav !== 'schulische-bildung-hub';
}

export function isSchulischeBildungSection(
  nav: NavView,
  jvaAreaContext: DashboardAreaKey | null,
): boolean {
  return nav === 'schulische-bildung-hub' || nav === 'schulische-bildung' || (nav === 'jva' && jvaAreaContext === 'schulische-bildung');
}

export function getDashboardArea(nav: DashboardAreaKey): DashboardArea {
  const area = DASHBOARD_AREAS.find((a) => a.key === nav);
  if (!area) return DASHBOARD_AREAS[0];
  return area;
}
