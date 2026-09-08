import type { LucideIcon } from "lucide-react";
import { Briefcase, GraduationCap, Hammer, Percent } from "lucide-react";
import type {
  DashboardAreaFreiePlaetzeKey,
  DashboardAreaHubKey,
  DashboardAreaKey,
  NavView,
} from "../types/domain";

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

export const DASHBOARD_AREA_KEYS = DASHBOARD_AREAS.map((area) => area.key);

export const AREAS_WITH_FREIE_PLAETZE = [
  "schulische-bildung",
  "berufliche-bildung",
] as const satisfies readonly DashboardAreaKey[];

export type AreaWithFreiePlaetze = (typeof AREAS_WITH_FREIE_PLAETZE)[number];

export const AREA_COURSE_CATEGORY_KEYS: Record<AreaWithFreiePlaetze, string[]> = {
  "schulische-bildung": ["SF", "VM", "SA", "ST", "SO"],
  "berufliche-bildung": ["AB"],
};

export function getHubKey(area: DashboardAreaKey): DashboardAreaHubKey {
  return `${area}-hub`;
}

export function getFreiePlaetzeKey(area: AreaWithFreiePlaetze): DashboardAreaFreiePlaetzeKey {
  return `${area}-freie-plaetze`;
}

export function isDashboardNav(nav: NavView): nav is DashboardAreaKey {
  return (DASHBOARD_AREA_KEYS as string[]).includes(nav);
}

export function isDashboardHub(nav: NavView): nav is DashboardAreaHubKey {
  return nav.endsWith("-hub");
}

export function isFreiePlaetzeNav(nav: NavView): nav is DashboardAreaFreiePlaetzeKey {
  return nav.endsWith("-freie-plaetze");
}

export function getAreaFromHub(nav: DashboardAreaHubKey): DashboardAreaKey {
  return nav.slice(0, -4) as DashboardAreaKey;
}

export function getAreaFromFreiePlaetze(nav: DashboardAreaFreiePlaetzeKey): DashboardAreaKey {
  return nav.replace("-freie-plaetze", "") as DashboardAreaKey;
}

export function areaHasFreiePlaetze(areaKey: DashboardAreaKey): areaKey is AreaWithFreiePlaetze {
  return (AREAS_WITH_FREIE_PLAETZE as readonly string[]).includes(areaKey);
}

export function getActiveAreaKey(
  nav: NavView,
  jvaAreaContext: DashboardAreaKey | null,
): DashboardAreaKey | null {
  if (isDashboardNav(nav)) return nav;
  if (isDashboardHub(nav)) return getAreaFromHub(nav);
  if (isFreiePlaetzeNav(nav)) return getAreaFromFreiePlaetze(nav);
  if (nav === "jva" && jvaAreaContext) return jvaAreaContext;
  return null;
}

export function isDashboardAreaSection(
  nav: NavView,
  areaKey: DashboardAreaKey,
  jvaAreaContext: DashboardAreaKey | null,
): boolean {
  if (nav === getHubKey(areaKey)) return true;
  if (nav === areaKey) return true;
  if (areaHasFreiePlaetze(areaKey) && nav === getFreiePlaetzeKey(areaKey)) return true;
  if (nav === "jva" && jvaAreaContext === areaKey) return true;
  return false;
}

export function getDashboardArea(nav: DashboardAreaKey): DashboardArea {
  const area = DASHBOARD_AREAS.find((a) => a.key === nav);
  if (!area) return DASHBOARD_AREAS[0];
  return area;
}
