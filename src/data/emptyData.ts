import type { EducationMeasureRecord, KpiValue } from '../types/domain';

export const EMPTY_EDUCATION_RECORDS: EducationMeasureRecord[] = [];

export const EMPTY_KPI_DEFINITIONS: Omit<KpiValue, 'value' | 'status'>[] = [
  { key: 'employment_total', label: 'Beschäftigungsquote gesamt', unit: '%' },
  { key: 'employment_education', label: 'Beschäftigungsquote schulische Bildung', unit: '%' },
  { key: 'utilization_education', label: 'Auslastungsquote schulische Maßnahmen', unit: '%' },
  { key: 'participants_vs_target', label: 'Teilnehmende / Soll-Plätze', unit: 'Anzahl' },
  { key: 'free_places', label: 'Freie Plätze', unit: 'Anzahl' },
  { key: 'school_completions', label: 'Erreichte Schulabschlüsse', unit: 'Anzahl' },
  { key: 'target_achievements', label: 'Zielerreichungen (nicht abschlussbezogen)', unit: 'Anzahl' },
  { key: 'early_terminations', label: 'Vorzeitige Beendigungen / Abbruchquote', unit: '%' },
  { key: 'pedagogical_staff', label: 'Pädagogischer Dienst (Stellen / besetzt / extern)', unit: 'Anzahl' },
  { key: 'elis', label: 'eLis (Lernplätze / Mandantschaften)', unit: 'Anzahl' },
];

export function createEmptyKpis(): KpiValue[] {
  return EMPTY_KPI_DEFINITIONS.map((definition) => ({
    ...definition,
    value: null,
    nrwComparison: null,
    status: 'empty' as const,
    subline: 'Daten aus BASIS-Web',
  }));
}

export const EMPTY_KPIS: KpiValue[] = createEmptyKpis();

export const EMPTY_CHART_COURSE_BY_CATEGORY: { categoryKey: string; label: string; value: number | null }[] =
  [];

export const EMPTY_CHART_UTILIZATION_TREND: { period: string; utilization: number | null }[] = [];

export const EMPTY_CHART_TERMINATION_REASONS: { reasonKey: string; label: string; count: number | null }[] =
  [];

export const EMPTY_CHART_JVA_COMPARISON: { jvaId: string; utilization: number | null }[] = [];

export const emptyNrwKpis = {
  beschaeftigungsquote: null as number | null,
  schulischeBildung: null as number | null,
  auslastung: null as number | null,
  teilnehmende: null as number | null,
  sollPlaetze: null as number | null,
  freiePlaetze: null as number | null,
  vorzeitigeBeendigungen: null as number | null,
  abbruchquote: null as number | null,
  abschluesse: null as number | null,
  zielerreichungen: null as number | null,
  paedStellen: null as number | null,
  paedBesetzt: null as number | null,
  paedExtern: null as number | null,
  elisLernplaetze: null as number | null,
  elisMandantschaften: null as number | null,
  elisDigitaleSozialraeume: null as number | null,
  elisHaftraeume: null as number | null,
  schulraeume: null as number | null,
  elisSchulraeume: null as number | null,
};
