# Cursor-Prompt v2: Dashboard-Mock-up Kennzahlensystem Schulische Bildung im Justizvollzug NRW

Du bist ein erfahrener React-/TypeScript-Engineer und UX-Designer. Entwickle ein funktionsfähiges, präsentationsfähiges Dashboard-Mock-up für ein Kennzahlensystem „Schulische Bildung im Justizvollzug NRW“.

## Zentrale fachliche Klarstellung
Die in der Excel-Datei enthaltenen Dropdowns sind **keine Eingabefelder im Dashboard**. Sie sind als **Eingabefelder/Katalogwerte in BASIS-Web** bzw. in der künftigen Erfassungslogik vorgesehen.

Das Dashboard soll diese aus BASIS stammenden Werte später **auswerten, gruppieren, zählen, filtern und visualisieren**. Es soll im Dashboard selbst zunächst **keine manuellen Dropdown-Eingaben für Kennzahlen** geben und **keine erfundenen Zahlenwerte hart vorbefüllen**.

Die Dropdown-/Katalogwerte erscheinen im Dashboard daher als:
- Filterkategorien,
- Spaltenwerte in Tabellen,
- Gruppierungen in Diagrammen,
- Kennzahlen-Dimensionen, z. B. „Abbrüche nach Beendigungsgrund“ oder „Teilnehmende nach Kursgrundbezeichnung“.

## Ziel des Prototyps
Erstelle einen klickbaren Frontend-Prototypen, der die fachliche Struktur, Navigation, Filterlogik und Dashboard-Anordnung zeigt. Die Ansicht darf mit leeren Platzhalterzuständen arbeiten, z. B. „—“, „Daten aus BASIS-Web“, „Noch keine Daten geladen“ oder Skeleton-/Empty-State-Komponenten.

Optional darf es einen **Demo-Daten-Modus** geben, der über einen deutlich sichtbaren Schalter aktiviert wird. Standardmäßig muss der Prototyp aber ohne vorbefüllte Kennzahlen starten.

## Datengrundlage
Nutze die bereitgestellten Dateien:
- `Idee Schule.pptx`: fachliches Zielbild mit Ministeriumsübersicht, JVA-Stammdatenblatt, Filterdimensionen, Kennzahlenbereichen und weiteren Auswertungen.
- `Bildungskennzahlen_schulische Bildung_Drop-down_BASIS.xlsx`: fachlicher Katalog für BASIS-Eingabewerte, insbesondere Kurskategorien, Kursgrundbezeichnungen und Beendigungsgründe.

Wenn das direkte Einlesen der Excel-Datei zu aufwändig ist, überführe die Katalogdaten initial als TypeScript-Konstanten in `src/data/catalog.ts`.

## Technologiestack
Erstelle eine moderne React-Anwendung mit:
- Vite + React + TypeScript
- Tailwind CSS
- Recharts für Diagrammflächen und spätere Visualisierungen
- lucide-react für Icons
- optional shadcn/ui, wenn schnell einrichtbar

Die Anwendung muss mit `npm install` und `npm run dev` startbar sein.

## Rollenlogik / Zielgruppen
Baue zwei zentrale Nutzungsmodi:

### 1. Ministeriumsansicht „NRW gesamt“
Zweck: landesweite Steuerung, Vergleichbarkeit, Monitoring, Vorbereitung von Fachabfragen und strategische Sicht auf schulische Bildung im Justizvollzug NRW.

### 2. JVA-Ansicht „Stammdatenblatt je JVA“
Zweck: anstaltsbezogene Sicht für einzelne JVAen mit Vergleich zum Landeswert, Kursangeboten, Personal-/eLis-Informationen und Datenqualitäts-Hinweisen.

## Wichtig: Keine Dashboard-Eingabeformulare für BASIS-Dropdowns
Baue im Dashboard **keine Formulare**, mit denen Nutzer Beendigungsgründe, Kursbezeichnungen oder Kennzahlenwerte eingeben.

Nicht bauen:
- keine Eingabe von Teilnehmendenzahlen im Dashboard,
- keine Eingabe von Soll-Plätzen im Dashboard,
- keine manuelle Auswahl eines Beendigungsgrundes zur Erfassung im Dashboard,
- keine fachliche Kursanmeldung als produktive Eingabemaske im Dashboard.

Stattdessen bauen:
- Filter nach Kurs-Überkategorie,
- Filter nach Kursgrundbezeichnung,
- Filter nach Beendigungsgrund,
- Filter nach Abschlussart,
- Filter nach Zeitraum, JVA, Geschlecht, Vollzugsform und Vollzugstyp,
- Tabellen und Diagrammflächen, die diese Dimensionen später aus BASIS-Daten auswerten.

## Empty-State-Logik
Da zunächst keine Zahlen gefüllt werden sollen, muss der Startzustand des Dashboards bewusst als leerer Auswertungsrahmen gestaltet sein.

Beispiele:
- KPI-Karte „Beschäftigungsquote schulische Bildung“ zeigt „—“ und Unterzeile „Wird aus BASIS-Web berechnet“.
- Diagramm „Beendigungsgründe“ zeigt leeren Diagrammrahmen mit Hinweis „Keine Daten für aktuelle Filterauswahl“.
- Tabelle „Kursangebote nach JVA“ zeigt Spaltenüberschriften, aber keine Beispielzahlen; stattdessen eine Empty-State-Zeile.
- Tabellen- und Diagrammkomponenten müssen so gebaut sein, dass sie später echte Daten anzeigen können.

Optionaler Demo-Modus:
- Implementiere `demoMode: boolean`.
- Standardwert: `false`.
- Nur wenn Demo-Modus aktiviert ist, werden synthetische Beispielwerte angezeigt.
- Demo-Modus muss visuell klar als „Demo-Daten“ gekennzeichnet sein.

## Fachliches Datenmodell
Lege TypeScript-Interfaces an:

```ts
export interface Jva {
  id: string;
  name: string;
  region?: string;
  geschlecht: 'männlich' | 'weiblich' | 'gemischt';
  vollzugsform: 'offen' | 'geschlossen' | 'beides';
  vollzugstyp: 'Erwachsenenvollzug' | 'Jugendvollzug' | 'beides';
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
  minimumPlacesAdults?: number | null;
  duration?: string | null;
  hasFormalCompletion: boolean;
}

export interface TerminationReason {
  key: string;
  level1: 'reguläre Beendigung' | 'vorzeitige Beendigung';
  label: string;
  classification?: 'verschuldet' | 'unverschuldet' | 'neutral' | 'offen';
  requiresCompletionType?: boolean;
  requiresFreeTextInBasis?: boolean;
}

export interface EducationMeasureRecord {
  id: string;
  reportingPeriod: string;
  jvaId: string;
  courseCategoryKey: string;
  courseTypeKey: string;
  geschlecht?: string;
  vollzugsform?: string;
  vollzugstyp?: string;
  participants?: number | null;
  targetPlaces?: number | null;
  completions?: number | null;
  targetAchievements?: number | null;
  terminations?: number | null;
  terminationReasonKey?: string | null;
  completionType?: string | null;
}
```

Wichtig: Zahlenfelder sind optional bzw. `null`, damit der Prototyp sauber mit noch nicht vorhandenen Daten umgehen kann.

## Katalogwerte aus BASIS / Excel abbilden
Bilde die Kurs-Überkategorien und Kursgrundbezeichnungen als Katalog ab:

1. Sprachliche Förderung
   - Crashkurs – Sprachliche Erstversorgung
   - Alphabetisierungskurs
   - Integrationskurs

2. Vorqualifizierende Maßnahmen
   - Elementarkurs
   - Förderkurs
   - Liftkurs

3. Schulabschlussbezogene Maßnahmen
   - Hauptschulabschluss Klasse 9/10A bzw. ESA/EESA
   - Realschulabschluss / Fachoberschulreife bzw. MSA
   - Hochschulreife

4. Studium
   - Fachhochschulstudium
   - Hochschulstudium FU Hagen Vollzeit- oder Teilzeitstudium
   - Hochschulstudium FU Hagen Kursstudium
   - Studium an anderer Hochschule als FU Hagen

5. Ausbildungsvorbereitung
   - Ausbildungsvorbereitungsjahr (AVJ)-HS 9
   - Sonderform des Ausbildungsvorbereitungsjahrs (S-AVJ)
   - Berufsfachschule BS 1 – HS 10
   - Berufsfachschule BS 1 – FOR & Q-Vermerk
   - 1.–3. Berufsschuljahr

Die Beendigungsgründe sollen ebenfalls als Katalogdimensionen abgebildet werden, nicht als Dashboard-Eingabe:
- reguläre Beendigung,
- Zielerreichung ohne Regelabschluss,
- erfolgreicher Regelabschluss,
- ohne Abschluss / nicht bestanden,
- disziplinarische Gründe,
- Verweigerung / freiwilliges Ausscheiden,
- gesundheitliche oder kognitive Einschränkung,
- Entlassung,
- Verlegung,
- Maßnahmenwechsel,
- Sicherungsmaßnahmen,
- Lockerungsmissbrauch,
- Entweichung / Nichtrückkehr,
- sonstige / offen zu klären.

## Filterleiste
Baue eine zentrale Filterleiste. Die Filter sind Auswertungsfilter, keine Datenerfassung.

Filter:
- Zeitraum: Monat / Quartal / Jahr
- Berichtszeitraum: leerer Startwert, später auswählbar
- Organisationsebene: NRW gesamt / einzelne JVA
- JVA
- Geschlecht: alle / männlich / weiblich
- Vollzugsform: alle / offen / geschlossen
- Vollzugstyp: alle / Erwachsenen- / Jugendvollzug
- Kurs-Überkategorie
- Kursgrundbezeichnung
- Beendigungsgrund
- Abschlussart

Alle Filter sollen initial auf „Alle“ oder „Nicht ausgewählt“ stehen.

## Ministeriumsansicht „NRW gesamt“
Baue folgende Bereiche:

### KPI-Karten mit Empty State
- Beschäftigungsquote gesamt
- Beschäftigungsquote schulische Bildung
- Auslastungsquote schulische Maßnahmen
- Teilnehmende / Soll-Plätze
- freie Plätze
- erreichte Schulabschlüsse
- Zielerreichungen bei nicht abschlussbezogenen Maßnahmen
- vorzeitige Beendigungen / Abbruchquote
- pädagogischer Dienst: Stellen / besetzt / externe Kräfte
- eLis: Lernplätze / Mandantschaften

Jede Karte zeigt im Startzustand:
- Wert: `—`
- Unterzeile: „Daten aus BASIS-Web“ bzw. „Datenquelle offen“
- optional kleines Badge: „nicht geladen“

### Visualisierungen mit Empty State
- Balkendiagrammfläche „Kursangebote nach Überkategorie“
- Liniendiagrammfläche „Entwicklung Auslastungsquote“
- Donut-/Balkendiagrammfläche „Beendigungsgründe“
- Balkendiagrammfläche „JVA-Vergleich“

Wenn keine Daten vorhanden sind, zeige eine Empty-State-Komponente mit Hinweistext.

### Tabellen
- Tabelle „Alle Anstalten“ mit Spalten: JVA, Kurs-Überkategorien, Kursgrundbezeichnungen, Teilnehmende, Soll-Plätze, Auslastung, freie Plätze, Beendigungen, Datenstand
- Tabelle „Tagesaktuell freie Plätze“ mit Spalten: JVA, Kursgrundbezeichnung, Geschlecht, Vollzugsform, Vollzugstyp, freie Plätze, Datenstand

Startzustand: Tabellenkopf sichtbar, keine erfundenen Zahlen, Empty-State-Zeile.

## JVA-Ansicht „Stammdatenblatt je JVA“
Baue folgende Bereiche:
- ausgewählte JVA oben als Kontextkarte
- KPI-Karten wie oben, jeweils mit Platzhalterwert und Vergleichsbereich „NRW-Vergleich: —“
- Kursangebot der JVA als Tabelle
- Beendigungsgründe der JVA als leere Auswertungsfläche
- Personalblock
- eLis-Block
- Hinweisblock „Datenqualität / offene Klärungen“

## Bereich „BASIS-Katalogwerte“
Baue einen reinen Anzeige-/Dokumentationsbereich, keine produktive Eingabemaske:
- Kurskatalog anzeigen: Überkategorie → Grundbezeichnung → Mindest-Soll-Plätze → Dauer
- Beendigungsgründe anzeigen: Ebene 1 → Grund → Klassifikation → Hinweise
- Hinweistext: „Diese Werte sind als Erfassungs-/Dropdownwerte in BASIS-Web vorgesehen und werden im Dashboard nur zur Filterung und Auswertung verwendet.“

## Komponentenstruktur
Lege mindestens folgende Struktur an:

```txt
src/
  App.tsx
  components/
    Layout.tsx
    FilterBar.tsx
    KpiCard.tsx
    EmptyState.tsx
    NrwOverview.tsx
    JvaDetail.tsx
    BasisCatalogView.tsx
    ChartShell.tsx
    JvaComparisonTable.tsx
    FreeCapacityTable.tsx
    CourseCatalogTable.tsx
    TerminationReasonCatalogTable.tsx
    DemoModeToggle.tsx
  data/
    catalog.ts
    emptyData.ts
    demoData.ts
  types/
    domain.ts
  utils/
    calculations.ts
    filters.ts
```

## Berechnungslogik
Implementiere Berechnungen null-sicher:

```ts
calculateUtilization(participants?: number | null, targetPlaces?: number | null): number | null
calculateFreePlaces(targetPlaces?: number | null, participants?: number | null): number | null
calculateCompletionRate(completions?: number | null, participants?: number | null): number | null
calculateTerminationRate(terminations?: number | null, participants?: number | null): number | null
```

Wenn Werte fehlen, gib `null` zurück und zeige im UI `—`.

## Design
Seriöser, ruhiger Verwaltungs-/Ministeriumslook:
- Primärfarbe: dunkles Blau
- Hintergrund: helles Grau / sehr helles Blau
- Karten: weiß, klare Rahmen, dezente Schatten
- Badges: „BASIS-Web“, „nicht geladen“, „Demo-Daten“, „Datenquelle offen“
- 16:9-tauglich für Präsentationen
- Desktop-first

## Akzeptanzkriterien
- `npm install` läuft durch.
- `npm run dev` startet die Anwendung.
- Startzustand enthält keine erfundenen Zahlenwerte.
- Alle KPI-Karten können fehlende Daten als `—` anzeigen.
- Alle Filter sind initial neutral: „Alle“ oder „Nicht ausgewählt“.
- Die BASIS-Dropdownwerte werden als Katalog-, Filter- und Auswertungsdimensionen genutzt, nicht als Dashboard-Eingabefelder.
- Die Ministeriumsansicht und die JVA-Ansicht sind klickbar erreichbar.
- Tabellen und Diagramme haben saubere Empty States.
- Optionaler Demo-Modus ist klar gekennzeichnet und standardmäßig deaktiviert.
- Der Code ist so strukturiert, dass später echte BASIS-Web-Daten angebunden werden können.
