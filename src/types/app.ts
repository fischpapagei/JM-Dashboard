import type { DashboardAreaKey, DashboardFilters, NavView } from './domain';
import type { EntwicklungZeitraum } from '../utils/periods';

export type AppModule = 'landing' | 'kennzahlen' | 'weberfassung' | 'berichte';

export type LandesweitReportVariant = 'entwicklung' | 'jahresbericht';

export const LANDESWEIT_REPORT_VARIANT_LABELS: Record<LandesweitReportVariant, string> = {
  entwicklung: 'Grafischer Bericht (Entwicklung)',
  jahresbericht: 'Tabellarischer Bericht (Jahresbericht)',
};

export type BerichtAltersgruppeFilter = DashboardFilters['altersgruppe'];

export const BERICHT_ALTERSGRUPPE_OPTIONS: {
  value: BerichtAltersgruppeFilter;
  label: string;
}[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'Jugendvollzug', label: 'Jugendliche' },
  { value: 'Erwachsenenvollzug', label: 'Erwachsene' },
];

export interface KennzahlenLaunchContext {
  areaKey: DashboardAreaKey;
  nav: NavView;
  jvaId?: string;
  reportingPeriod: string | null;
  demoMode: boolean;
  landesweitReportVariant?: LandesweitReportVariant;
  altersgruppe?: BerichtAltersgruppeFilter;
  entwicklungZeitraum?: EntwicklungZeitraum;
  berichtszeitpunkt?: string;
}
