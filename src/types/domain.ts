export type HaftartKey =
  | 'untersuchungshaft'
  | 'freiheitsstrafe_efs'
  | 'jugendstrafe'
  | 'sonstige'
  | 'sicherungsverwahrung';

export type HaftartFilter = 'alle' | HaftartKey;

export interface Jva {
  id: string;
  name: string;
  region?: string;
  geschlecht: 'männlich' | 'weiblich' | 'gemischt';
  haftform: 'offen' | 'geschlossen' | 'beides';
  altersgruppe: 'Erwachsenenvollzug' | 'Jugendvollzug' | 'beides';
}

export interface CourseCategory {
  key: string;
  label: string;
  description?: string;
}

export interface CourseType {
  key: string;
  categoryKey: string;
  label: string;
  shortLabel?: string;
  minimumPlacesAdults?: number | null;
  duration?: string | null;
  hasFormalCompletion: boolean;
}

export type TerminationLevel1 = 'reguläre Beendigung' | 'vorzeitige Beendigung';

export interface TerminationReason {
  key: string;
  level1: TerminationLevel1;
  label: string;
  classification?: 'verschuldet' | 'unverschuldet' | 'neutral' | 'offen';
  requiresCompletionType?: boolean;
  requiresFreeTextInBasis?: boolean;
  applicableCategories?: string;
}

export type Kursleitung = 'intern' | 'extern';

export type Massnahmenbeginn =
  | { type: 'fortlaufend' }
  | { type: 'stichtag'; dates: string[] };

export interface EducationMeasureRecord {
  id: string;
  reportingPeriod: string;
  jvaId: string;
  courseCategoryKey: string;
  courseTypeKey: string;
  geschlecht?: string;
  haftform?: string;
  altersgruppe?: string;
  haftart?: string;
  participants?: number | null;
  targetPlaces?: number | null;
  completions?: number | null;
  targetAchievements?: number | null;
  terminations?: number | null;
  regulaereBeendigungen?: number | null;
  vorzeitigeBeendigungen?: number | null;
  terminationReasonKey?: string | null;
  completionType?: string | null;
  kursleitung?: Kursleitung | null;
  massnahmenbeginn?: Massnahmenbeginn | null;
}

export type TimeGranularity = 'month' | 'quarter' | 'year';

export interface DashboardFilters {
  timeGranularity: TimeGranularity | null;
  reportingPeriod: string | null;
  organizationLevel: 'nrw' | 'jva';
  jvaId: string | null;
  geschlecht: 'alle' | 'männlich' | 'weiblich';
  haftform: 'alle' | 'offen' | 'geschlossen';
  altersgruppe: 'alle' | 'Erwachsenenvollzug' | 'Jugendvollzug';
  haftart: HaftartFilter;
  courseCategoryKey: string | null;
  courseTypeKey: string | null;
  terminationReasonKey: string | null;
  completionType: string | null;
}

export type KpiStatus = 'empty' | 'loaded' | 'demo';

export interface KpiValue {
  key: string;
  label: string;
  value: number | null;
  unit?: '%' | 'Anzahl' | string;
  subline?: string;
  nrwComparison?: number | null;
  status?: KpiStatus;
}

export type DashboardAreaKey =
  | 'schulische-bildung'
  | 'berufliche-bildung'
  | 'arbeit-arbeitstherapie'
  | 'beschaeftigungsquote';

export type NavView = DashboardAreaKey | 'jva' | 'schulische-bildung-hub';


export interface JvaTableRow {
  jvaId: string;
  jvaName: string;
  courseCategory: string;
  courseType: string;
  participants?: number | null;
  targetPlaces?: number | null;
  utilization: number | null;
  freePlaces?: number | null;
  terminations?: number | null;
  dataStatus: string;
}

export interface FreeCapacityRow {
  jvaId: string;
  jvaName: string;
  courseCategoryKey: string;
  courseCategory: string;
  courseTypeKey: string;
  courseType: string;
  geschlecht: string;
  haftform: string;
  altersgruppe?: string;
  haftart?: string;
  freePlaces: number | null;
  dataStatus: string;
}

export interface SchoolRoom {
  id: string;
  jvaId: string;
  designation: string;
  squareMeters: number;
  isElis: boolean;
}

export interface JvaSchoolRoomSummary {
  jvaId: string;
  jvaName: string;
  schulraeume: number;
  elisSchulraeume: number;
  rooms: SchoolRoom[];
}

export const defaultFilters: DashboardFilters = {
  timeGranularity: null,
  reportingPeriod: null,
  organizationLevel: 'nrw',
  jvaId: null,
  geschlecht: 'alle',
  haftform: 'alle',
  altersgruppe: 'alle',
  haftart: 'alle',
  courseCategoryKey: null,
  courseTypeKey: null,
  terminationReasonKey: null,
  completionType: null,
};
