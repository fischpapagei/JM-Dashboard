import type { CourseCategory, CourseType, TerminationReason } from '../types/domain';

/** Katalog aus BASIS-Excel (Stand 03.06.2026). */
export const COURSE_CATEGORIES: CourseCategory[] = [
  { key: 'SF', label: 'Sprachliche Förderung' },
  { key: 'VM', label: 'Vorqualifizierende Maßnahmen' },
  { key: 'SA', label: 'Schulabschlussbezogene Maßnahmen' },
  { key: 'ST', label: 'Studium' },
  { key: 'AB', label: 'Ausbildungsvorbereitung' },
  { key: 'SO', label: 'Sonstige' },
];

export const COURSE_TYPES: CourseType[] = [
  {
    key: 'SF.1',
    categoryKey: 'SF',
    label: 'Crashkurs – Sprachliche Erstversorgung',
    shortLabel: 'Crashkurs',
    minimumPlacesAdults: 6,
    duration: '3 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'SF.2',
    categoryKey: 'SF',
    label: 'Alphabetisierungskurs',
    shortLabel: 'Alphabetisierung',
    minimumPlacesAdults: 6,
    duration: '3 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'SF.3',
    categoryKey: 'SF',
    label: 'Integrationskurs',
    shortLabel: 'Integrationskurs',
    minimumPlacesAdults: 6,
    duration: '6 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'VM.1',
    categoryKey: 'VM',
    label: 'Elementarkurs',
    shortLabel: 'Elementarkurs',
    minimumPlacesAdults: 6,
    duration: '6 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'VM.2',
    categoryKey: 'VM',
    label: 'Förderkurs',
    shortLabel: 'Förderkurs',
    minimumPlacesAdults: 6,
    duration: '6 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'VM.3',
    categoryKey: 'VM',
    label: 'Liftkurs',
    shortLabel: 'Liftkurs',
    minimumPlacesAdults: 6,
    duration: '6 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'SA.1',
    categoryKey: 'SA',
    label: 'ESA / EESA (früher HSA 9 und 10)',
    shortLabel: 'ESA/EESA',
    minimumPlacesAdults: 8,
    duration: '6–12 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'SA.2',
    categoryKey: 'SA',
    label: 'MSA (früher FOR)',
    shortLabel: 'MSA/Realschule',
    minimumPlacesAdults: 8,
    duration: '12 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'SA.3',
    categoryKey: 'SA',
    label: 'Hochschulreife',
    shortLabel: 'Abitur',
    minimumPlacesAdults: 8,
    duration: '36 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'ST.1',
    categoryKey: 'ST',
    label: 'Fachhochschulstudium',
    shortLabel: 'FH-Studium',
    minimumPlacesAdults: null,
    duration: null,
    hasFormalCompletion: true,
  },
  {
    key: 'ST.2',
    categoryKey: 'ST',
    label: 'Hochschulstudium FU Hagen – Vollzeit-/Teilzeitstudium',
    shortLabel: 'FU Hagen VZ/TZ',
    minimumPlacesAdults: 7,
    duration: null,
    hasFormalCompletion: true,
  },
  {
    key: 'ST.3',
    categoryKey: 'ST',
    label: 'Hochschulstudium FU Hagen – Kursstudium',
    shortLabel: 'FU Hagen Kurs',
    minimumPlacesAdults: 7,
    duration: null,
    hasFormalCompletion: true,
  },
  {
    key: 'ST.4',
    categoryKey: 'ST',
    label: 'Studium an anderer Hochschule als FU Hagen',
    shortLabel: 'Studium extern',
    minimumPlacesAdults: null,
    duration: null,
    hasFormalCompletion: true,
  },
  {
    key: 'AB.1',
    categoryKey: 'AB',
    label: 'AVJ – Ausbildungsvorbereitungsjahr (HS 9)',
    shortLabel: 'AVJ',
    minimumPlacesAdults: null,
    duration: '12 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'AB.2',
    categoryKey: 'AB',
    label: 'S-AVJ – Sonderform Ausbildungsvorbereitungsjahr',
    shortLabel: 'S-AVJ',
    minimumPlacesAdults: null,
    duration: '12 Monate',
    hasFormalCompletion: false,
  },
  {
    key: 'AB.3',
    categoryKey: 'AB',
    label: 'Berufsfachschule BS 1 – HS 10',
    shortLabel: 'BFS HS10',
    minimumPlacesAdults: null,
    duration: '12 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'AB.4',
    categoryKey: 'AB',
    label: 'Berufsfachschule BS 1 – FOR & Q-Vermerk',
    shortLabel: 'BFS FOR',
    minimumPlacesAdults: null,
    duration: '12 Monate',
    hasFormalCompletion: true,
  },
  {
    key: 'AB.5',
    categoryKey: 'AB',
    label: '1.–3. Berufsschuljahr (Vollausbildung/Teilqualifizierung)',
    shortLabel: 'Berufsschule',
    minimumPlacesAdults: null,
    duration: null,
    hasFormalCompletion: true,
  },
  {
    key: 'AB.6',
    categoryKey: 'AB',
    label: 'Sonst. begleitende/vorbereitende schulische Maßnahmen im Kontext berufl. Bildung',
    shortLabel: 'Begl. Maßnahme beruf.',
    minimumPlacesAdults: null,
    duration: null,
    hasFormalCompletion: false,
  },
  {
    key: 'SO.1',
    categoryKey: 'SO',
    label: 'Individuell von JVA einzutragende Maßnahme',
    shortLabel: 'Sonstige',
    minimumPlacesAdults: null,
    duration: null,
    hasFormalCompletion: false,
  },
];

export const TERMINATION_REASONS: TerminationReason[] = [
  {
    key: 'RB-01',
    level1: 'reguläre Beendigung',
    label: 'Zielerreichung ohne Regelabschluss',
    classification: 'neutral',
    applicableCategories: 'SF, VM',
  },
  {
    key: 'RB-02',
    level1: 'reguläre Beendigung',
    label: 'Erfolgreicher Regelabschluss',
    classification: 'neutral',
    requiresCompletionType: true,
    applicableCategories: 'SA, ST, AB',
  },
  {
    key: 'RB-03',
    level1: 'reguläre Beendigung',
    label: 'Beendigung ohne Abschluss (nicht bestanden)',
    classification: 'neutral',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-01',
    level1: 'vorzeitige Beendigung',
    label: 'Disziplinarische Gründe',
    classification: 'verschuldet',
    requiresFreeTextInBasis: true,
    applicableCategories: 'alle',
  },
  {
    key: 'VB-02',
    level1: 'vorzeitige Beendigung',
    label: 'Freiwilliges Ausscheiden',
    classification: 'neutral',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-03',
    level1: 'vorzeitige Beendigung',
    label: 'Unzureichende Fähigkeiten / gesundheitliche Einschränkung / Arbeitsunfähigkeit',
    classification: 'unverschuldet',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-04',
    level1: 'vorzeitige Beendigung',
    label: 'Angeordnete Sicherungsmaßnahmen',
    classification: 'unverschuldet',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-05',
    level1: 'vorzeitige Beendigung',
    label: '(Vorzeitige) Entlassung oder Verlegung',
    classification: 'neutral',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-06',
    level1: 'vorzeitige Beendigung',
    label: 'Maßnahmenwechsel',
    classification: 'neutral',
    applicableCategories: 'alle',
  },
  {
    key: 'VB-07',
    level1: 'vorzeitige Beendigung',
    label: '(Versuchte) Entweichung oder Nichtrückkehr',
    classification: 'verschuldet',
    applicableCategories: 'alle',
  },
];

export interface CompletionTypeOption {
  key: string;
  label: string;
  group: 'schulisch' | 'hochschule' | 'ausbildung';
}

/** Dropdown 3 bei RB-02 (Abschlussart). */
export const COMPLETION_TYPES: CompletionTypeOption[] = [
  { key: 'ESA', label: 'ESA', group: 'schulisch' },
  { key: 'EESA', label: 'EESA', group: 'schulisch' },
  { key: 'MSA', label: 'MSA', group: 'schulisch' },
  { key: 'FACHHOCHSCHULREIFE', label: 'Fachhochschulreife', group: 'schulisch' },
  { key: 'HOCHSCHULREIFE', label: 'Hochschulreife', group: 'schulisch' },
  { key: 'BACHELOR_FH', label: 'Bachelor (FH)', group: 'hochschule' },
  { key: 'BACHELOR_UNI', label: 'Bachelor (Uni)', group: 'hochschule' },
  { key: 'MASTER_FH', label: 'Master (FH)', group: 'hochschule' },
  { key: 'MASTER_UNI', label: 'Master (Uni)', group: 'hochschule' },
  { key: 'HS10', label: 'HS 10', group: 'ausbildung' },
  { key: 'FOR', label: 'FOR', group: 'ausbildung' },
  { key: 'INDIVIDUELL', label: 'Individuell (ausbildungsabhängig)', group: 'ausbildung' },
];

export const COURSE_TYPE_BY_KEY = Object.fromEntries(
  COURSE_TYPES.map((course) => [course.key, course]),
) as Record<string, CourseType>;

export const TERMINATION_REASON_BY_KEY = Object.fromEntries(
  TERMINATION_REASONS.map((reason) => [reason.key, reason]),
) as Record<string, TerminationReason>;

export const courseCategories = COURSE_CATEGORIES;
export const courseTypes = COURSE_TYPES;
export const terminationReasons = TERMINATION_REASONS;
export const completionTypes = COMPLETION_TYPES;

/** Haftarten für Auswertungsfilter (BASIS/Dashboard). */
export const HAFTARTEN = [
  { key: 'untersuchungshaft', label: 'Untersuchungshaft' },
  { key: 'freiheitsstrafe_efs', label: 'Freiheitsstrafe inkl. EFS' },
  { key: 'jugendstrafe', label: 'Jugendstrafe' },
  { key: 'sonstige', label: 'Sonstige Haftarten' },
  { key: 'sicherungsverwahrung', label: 'Sicherungsverwahrung' },
] as const;

export const HAFTART_BY_KEY = Object.fromEntries(
  HAFTARTEN.map((h) => [h.key, h]),
) as Record<string, { key: string; label: string }>;

export function getHaftartLabel(key?: string | null): string {
  if (!key) return '—';
  return HAFTART_BY_KEY[key]?.label ?? key;
}
