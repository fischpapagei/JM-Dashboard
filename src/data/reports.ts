import type { DashboardAreaKey } from '../types/domain';
import type { UserRole } from '../types/auth';

export type ReportKey =
  | 'schulischer-bildungsbericht-landesweit'
  | 'schulischer-bildungsbericht-jva'
  | 'schulteilnehmende-landesweit'
  | 'schulteilnehmende-jva'
  | 'auslastungsquote-landesweit'
  | 'auslastungsquote-jva'
  | 'beendigungsgruende-landesweit'
  | 'beendigungsgruende-jva'
  | 'schulabschluesse-landesweit'
  | 'schulabschluesse-jva'
  | 'kursangebote-landesweit'
  | 'sollplaetze-veraenderung'
  | 'schulraeume-landesweit'
  | 'stellen-landesweit'
  | 'elis-raeume-mandantschaften';

export type ReportStatus = 'available' | 'planned';

export type ReportFormat = 'pdf';

export interface ReportDefinition {
  key: ReportKey;
  title: string;
  description: string;
  contents: string[];
  status: ReportStatus;
  formats: ReportFormat[];
  areaKey: DashboardAreaKey;
  scope: 'nrw' | 'jva';
  roles: UserRole[];
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: 'schulischer-bildungsbericht-landesweit',
    title: 'Schulischer Bildungsbericht landesweit',
    description:
      'PDF-Bericht zur schulischen Bildung in NRW mit aktiven Filtern, KPI-Übersicht und Grafiken zur landesweiten Auswertung.',
    contents: [
      'Wahl zwischen grafischem Bericht (Entwicklung) und tabellarischem Jahresbericht',
      'Filter nach Altersgruppe (Jugendliche, Erwachsene)',
      'Kennzahlen, Grafiken oder JVA-Vergleichstabellen je nach Berichtsausgabe',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'schulischer-bildungsbericht-jva',
    title: 'Schulischer Bildungsbericht JVA',
    description:
      'PDF-Bericht für eine Justizvollzugsanstalt mit Stammdaten, Kennzahlen, Grafiken und Kursangebotstabelle im Querformat.',
    contents: [
      'JVA-Stammdaten und aktive Filter',
      'Kennzahlen inkl. NRW-Vergleich',
      'Auslastung nach Kurs und Entwicklung der Auslastungsquote',
      'Beendigungsgründe und Zielerreichungen',
      'Kursangebot der JVA (Querformat)',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'jva',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'schulteilnehmende-landesweit',
    title: 'Schulteilnehmende (landesweit)',
    description:
      'Bericht 3a für das Ministerium: Verläufe und Tabellen der Teilnehmendenzahlen nach Altersgruppe, Geschlecht und Kurskategorie.',
    contents: [
      'Grafiken für Erwachsene und Jugendliche (5 Quartale, 13 Monate, 11 Jahre)',
      'Detailverläufe je Hauptkategorie und Geschlecht über 11 Jahre',
      'Quartals- und Jahrestabellen mit Veränderungen',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'schulteilnehmende-jva',
    title: 'Schulteilnehmende einer JVA',
    description:
      'Bericht 3b: Teilnehmendenzahlen einer Anstalt analog Bericht 3a, nur vorhandene Angebote, inkl. NRW-Vergleich. Für das Ministerium und die jeweilige JVA.',
    contents: [
      'Grafiken für vorhandene Altersgruppen (5 Quartale, 13 Monate, 11 Jahre) inkl. NRW-Durchschnitt',
      'Detailverläufe nur für Kurse, die in der Anstalt angeboten werden',
      'Quartals- und Jahrestabellen mit NRW-Ø und Abweichung',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'jva',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'auslastungsquote-landesweit',
    title: 'Auslastungsquote (landesweit)',
    description:
      'Bericht 4a für das Ministerium: Entwicklung der Auslastungsquote nach Altersgruppe, Geschlecht und Kurskategorie.',
    contents: [
      'Grafiken für Erwachsene und Jugendliche (5 Quartale, 13 Monate, 11 Jahre)',
      'Kategorieverläufe über 11 Jahre getrennt für weiblich und männlich (6 Linien)',
      'Quartals- und Jahrestabellen mit Auslastung, Soll-Plätzen und Veränderungen',
      'Jahreswerte nur für abgeschlossene Kalenderjahre',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'auslastungsquote-jva',
    title: 'Auslastungsquote einer JVA',
    description:
      'Bericht 4b: Auslastungsquote einer Anstalt analog Bericht 4a, nur vorhandene Angebote, inkl. NRW-Vergleich. Für das Ministerium und die jeweilige JVA.',
    contents: [
      'Grafiken für vorhandene Altersgruppen (5 Quartale, 13 Monate, 11 Jahre) inkl. landesweiter Vergleich',
      'Kategorieverläufe nur für Kurse, die in der Anstalt angeboten werden',
      'Quartals- und Jahrestabellen mit NRW-Ø und Abweichung',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'jva',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'beendigungsgruende-landesweit',
    title: 'Beendigungsgründe (landesweit)',
    description:
      'Bericht 5a für das Ministerium: vorzeitige und reguläre Beendigungen nach Altersgruppe, Geschlecht und Grund.',
    contents: [
      'Grafiken für Erwachsene und Jugendliche (5 Quartale, 13 Monate, 11 Jahre)',
      'Detailverläufe der regulären und vorzeitigen Gründe über 11 Jahre, getrennt nach Geschlecht',
      'Quartals- und Jahrestabellen mit Veränderungen',
      'Auflistung der Freitextgründe im abgeschlossenen Jahr',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'beendigungsgruende-jva',
    title: 'Beendigungsgründe einer JVA',
    description:
      'Bericht 5b: Beendigungsgründe einer Anstalt analog Bericht 5a, nur vorhandene Aspekte, inkl. NRW-Vergleich. Für das Ministerium und die jeweilige JVA.',
    contents: [
      'Grafiken für vorhandene Altersgruppen und Geschlechter inkl. NRW-Durchschnitt',
      'Detailverläufe nur für Beendigungsgründe, die in der Anstalt vorkommen',
      'Quartals- und Jahrestabellen mit NRW-Ø und Abweichung',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'jva',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'schulabschluesse-landesweit',
    title: 'Erreichte Schulabschlüsse (landesweit)',
    description:
      'Bericht 6a für das Ministerium: erreichte Schulabschlüsse nach Altersgruppe, Geschlecht und Abschlussart.',
    contents: [
      '11-Jahres-Verlauf der Summe aller Abschlüsse (weiblich, männlich, Summe)',
      'Detailverläufe nach Abschlussart für weiblich, männlich und Summe',
      'Jahrestabelle mit Anteilen und Veränderungen',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'schulabschluesse-jva',
    title: 'Erreichte Schulabschlüsse einer JVA',
    description:
      'Bericht 6b: Erreichte Schulabschlüsse einer Anstalt analog Bericht 6a, nur vorhandene Aspekte, inkl. NRW-Vergleich. Für das Ministerium und die jeweilige JVA.',
    contents: [
      'Grafiken für vorhandene Altersgruppen, Geschlechter und Abschlussarten inkl. NRW-Durchschnitt',
      'Detailverläufe nur für Abschlussarten, die in der Anstalt vorkommen',
      'Jahrestabelle mit NRW-Ø und Abweichung',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'jva',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'kursangebote-landesweit',
    title: 'Kursangebote (landesweit)',
    description:
      'Bericht 7 / Bildungsbroschüre Teil 2: jährliche Übersicht der aktiven schulischen Kursangebote je Anstalt. Für alle Rollen abrufbar.',
    contents: [
      'Eine Sektion je JVA, Tabellen nach Geschlecht und Altersgruppe',
      'Nur vorhandene, aktive Kursangebote',
      'BASIS-Felder (Kursname, SOLL-Plätze) und jährliche Web-Erfassung (Dauer, Beginn, vorgesehener Abschluss)',
      'Spalte „Durchführung durch externe Kraft“ nur für JM, FB Päd. und ZBI',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry', 'jva'],
  },
  {
    key: 'sollplaetze-veraenderung',
    title: 'Veränderung der Schulkurse und deren Soll-Plätze',
    description:
      'Bericht 8 für FB Päd.: monatlicher Abgleich der Soll-Plätze und neu eingerichteten Schulkurse aus BASIS.',
    contents: [
      'Vergleich Soll-Plätze aktueller Monat vs. Vormonat je JVA und Kurs',
      'Rote Kennzeichnung veränderter Soll-Plätze, grün für neu eingerichtete Kurse',
      'Gesamtsumme der Soll-Plätze und der Veränderung',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'schulraeume-landesweit',
    title: 'Schulräume',
    description:
      'Bericht 9 für das Ministerium (inkl. FB Päd.): Übersicht der Schulräume je Anstalt mit Flächen, eLis-Ausstattung und Schulplätzen.',
    contents: [
      'Raumliste je JVA mit Bezeichnung, Anzahl, Größe, eLis und Schulplätzen',
      'Summenzeile je Anstalt und Gesamtsumme',
      'Jährliche Prüfung der Daten durch die Anstalten im Webformular',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'stellen-landesweit',
    title: 'Stellen',
    description:
      'Bericht 10 für das Ministerium (inkl. FB Päd.): Stellen des pädagogischen Dienstes je Anstalt, sofern die Daten vorliegen.',
    contents: [
      'Tabelle Stellen pädagogischer Dienst je JVA',
      'Anzahl Stellen und davon besetzt',
      'Summenzeile über alle Anstalten',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
  {
    key: 'elis-raeume-mandantschaften',
    title: 'elis Räume und Mandantschaften',
    description:
      'Bericht 11 für das Ministerium (inkl. FB Päd.): eLis-Mandantschaften, Schulräume und digitale Sozialräume je Anstalt.',
    contents: [
      'Mandantschaften mit Name, Kürzel, gemeldeter Anzahl und rabattierter Zählung',
      'Schulräume und digitale Sozialräume mit PC-Plätzen',
      'Rektorin/Rektor, Anmerkungen, Summe je JVA und Gesamtsumme',
    ],
    status: 'available',
    formats: ['pdf'],
    areaKey: 'schulische-bildung',
    scope: 'nrw',
    roles: ['ministry'],
  },
];

export type ReportAudience = 'jva' | 'ministry';

export function audienceFromScope(scope: ReportDefinition['scope']): ReportAudience {
  return scope === 'jva' ? 'jva' : 'ministry';
}

export function getReportsForRole(role: UserRole): ReportDefinition[] {
  return REPORT_DEFINITIONS.filter((report) => report.roles.includes(role));
}

export function getReportsForRoleAndAudience(
  role: UserRole,
  audience: ReportAudience,
): ReportDefinition[] {
  return getReportsForRole(role).filter((report) => audienceFromScope(report.scope) === audience);
}

export function getReportByKey(key: ReportKey): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((report) => report.key === key);
}

export function isInlinePreviewReport(key: ReportKey): boolean {
  return (
    key === 'schulteilnehmende-landesweit' ||
    key === 'schulteilnehmende-jva' ||
    key === 'auslastungsquote-landesweit' ||
    key === 'auslastungsquote-jva' ||
    key === 'beendigungsgruende-landesweit' ||
    key === 'beendigungsgruende-jva' ||
    key === 'schulabschluesse-landesweit' ||
    key === 'schulabschluesse-jva' ||
    key === 'kursangebote-landesweit' ||
    key === 'sollplaetze-veraenderung' ||
    key === 'schulraeume-landesweit' ||
    key === 'stellen-landesweit' ||
    key === 'elis-raeume-mandantschaften'
  );
}
