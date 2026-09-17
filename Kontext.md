# Kontext Kennzahlensystem Schulische Bildung NRW

## Stand
- Vite + React 19 + TypeScript + Tailwind v4 + Recharts
- **KERN UX:** `@kern-ux/native` (CSS/Schriften, GitLab [kern-ux-plain](https://gitlab.opencode.de/kern-ux/kern-ux-plain)) + `@kern-ux-annex/kern-react-kit` (React, GitLab [community/kern-react-kit](https://gitlab.opencode.de/kern-ux/community/kern-react-kit)); Fassade `src/ui/`
- `npm run build` erfolgreich

## UI-Struktur
- **Auth:** `ministerium`/`jm2026` (Landesübersicht, Anzeigename **Ministerium der Justiz NRW**), `jva-<slug>`/`jva2026` (nur eigene JVA)
- **Startseite:** drei App-Kacheln (Kennzahlensystem, Berichte, Web-Erfassung) plus zwei Portalkacheln darunter: **Beschäftigungsportal Justizvollzug** und **Bildungsangebote in den Justizvollzugsanstalten des Landes Nordrhein-Westfalen** (`data/landingPortals.ts`). Ohne hinterlegte URL öffnet `AppPortalView` („Portal folgt“). Über allen Bereichen außer Login liegt die **Hauptbereichsleiste** (`AppAreaBar` / `data/appAreas.ts`): Kennzahlensystem, Berichte, Web-Erfassung, Beschäftigungsportal; der aktive Bereich ist farblich hinterlegt. Bildungsangebote bleiben nur Startkachel, nicht in der Leiste. **Brotkrumen** (`AppBreadcrumb`) auf jeder Seite: Startseite → Hauptbereich → Abschnitt → aktuelle Ansicht; Zwischenstationen sind anwählbar.
- **Berichte:** `BerichteApp` — **Sidebar-Layout** (`JustizSidebar`) unter der Hauptbereichsleiste mit Berichtsebenen (JVA vs. Ministerium) und Berichtstypen. JVA-Navigation: **Schulischer Kurzbericht JVA** und **Ergänzende Berichte JVA** (3b–6b im Dropdown). Ministeriums-Navigation: **Schulischer Kurzbericht landesweit** und **Ergänzende landesweite Berichte** (3a–12 im Dropdown). In der Konfiguration: Berichtstyp, JVA wo nötig, Berichtszeitpunkt (bei Schulabschlüssen, Kursangeboten, Schulräumen und eLis-Räumen nur abgeschlossene Jahre), Altersgruppe bei den ersten sechs ergänzenden Berichten, Ausgabeformat erst in der Vorschau. Konfiguration mit KERN-Formularen. Anstaltsrolle sieht nur Ebenen mit verfügbaren Berichten. Inline-Vorschauen bleiben im Hauptbereich. Startkachel „Berichte“: PDF und Excel.
- **Kennzahlensystem:** ProtectedApp + SidebarLayout (`JustizSidebar`) unter der Hauptbereichsleiste. Filter, KPI-Karten, Tabellen und Auswertungsflächen in KERN (Karten, Formulare, Tabellen, Badges); Charts mit NRW-Nachtblau (`ui/chartTheme.ts`). **Beendigungsgründe:** reguläre Gründe (RB) Petrolgrün, alle übrigen Grau. **JVA-Stammdatenblatt (Ministerium):** JVA-Auswahl direkt unter der Seitenüberschrift (`Layout.titleMeta`), nicht mehr unter den Filtern. **NRW gesamt:** KPI-Raster und Chart-Karten wie JVA-Stammdatenblatt (weiße `dashboard-kpi`, eine Reihe mit 6 Kacheln ab `lg`, ohne mintgrünes Inset-Panel). Aktiver Sidebar-Eintrag in Nachtblau 50 % mit weißem Randstreifen, Kartenflächen weiß. Diagramm-Vergrößerung füllt die Fensterfläche (`ChartExpandModal`); Kategorie-Achsen schräg (Dashboard, Modal und Kurzbericht-PDF), damit lange Bezeichnungen nicht überlappen.
- **Tabellen in Berichten:** Spaltenbreite nach Inhalt (`table-auto`); Kennzahlen bleiben in der Zelle, breite Tabellen horizontal scrollbar. Die **ersten beiden Spalten** bleiben beim horizontalen Scrollen sichtbar (`ReportScrollTable`).
- **PDF-Export:** `generateKurzberichtPdf` speichert KPI-Karten und Diagramme als PNG mit verlustfreier Flate-Kompression (kein JPEG auf Nachtblau). KPI-Text 2,5-fach, Diagramme 1,5-fach (höhere SVG-Skalierung leert Balken). Große Querformat-Tabellen weiter JPEG. Animation aus.
- **Excel-Export Berichte 3–10 und 12:** Button „Excel erzeugen“ neben PDF (nur Demo-Modus); formatierte Workbooks via `utils/excelWorkbook.ts` + `utils/exportBerichteExcel.ts` (Justiz-Kopfzeilen, Summenzeilen, Prozentpunkte, negative Werte rot). **Native Excel-Diagramme** (OOXML, injiziert mit `fflate`, weil `xlsx-js-style` keine Charts kann): Berichte 3–6 dieselben Zeitreihen wie die Vorschau (Blätter „Diag …“), Berichte 7–10 Säulendiagramme aus den Tabellen (Blatt „Diagramme“). Bericht 11 ohne Excel, Bericht 12 Kontaktliste ohne Diagrammblatt.
- **Sidebar (Ministerium):** vier aufklappbare Bereiche in `data/dashboardAreas.ts`:
  1. **Schulische Bildung:** Hub → „NRW gesamt“, „Landesweit freie Plätze“, „JVA-Stammdatenblatt“
  2. **Berufliche Bildung:** Hub → „NRW gesamt“, „Landesweit freie Plätze“, „JVA-Stammdatenblatt“
  3. **Arbeit und Arbeitstherapie:** Hub → „NRW gesamt“, „JVA-Stammdatenblatt“
  4. **Beschäftigungsquote:** Hub → „NRW gesamt“, „JVA-Stammdatenblatt“
- **Landesweit freie Plätze:** `LandesweitFreiePlaetze` — KPI + Tabelle; **Excel-Export** (Pivot: JVA × Haupt-/Maßnahmenkategorie, inkl. Filterübersicht) via `ExcelExportButton` + `utils/exportFreiePlaetzeExcel.ts`
- **Web-Erfassung:** `WeberfassungApp` — **Sidebar-Layout** (`JustizSidebar` in `src/ui/`): Nachtblau mit KERN-Buttons, -Icons und Fira-Sans-Typografie; aufklappbare Kategorien. Offizielles KERN native hat keine Sidebar; das Community-Kit bietet nur ein schlankes Addon (`KernSidebar`/`KernSidebarItem`). Zwei Überkategorien in `data/weberfassungNav.ts`:
  - **Strukturdaten:** Schulische Bildung, Berufliche Bildung, Betriebe, eLis
  - **Haushalt:** Anmeldungen Arbeit und berufliche Bildung, Anmeldungen schulische Bildung, Prüfung FB Pädagogik, Prüfung ZBI
  - Formularseiten sind vorerst Platzhalter (KERN-Alert/Karte), ohne Speicherung

## Filter & Kennzahlen (funktional im Demo-Modus)
- **FilterBar** (`components/FilterBar.tsx`) — drei Ebenen, immer sichtbar:
  1. Zeitraum, Berichtszeitraum, Organisationsebene, JVA
  2. Geschlecht, Haftform, Altersgruppe, Haftart
  3. Kurs-Überkategorie, Kursgrundbezeichnung, Beendigungsgrund, Abschlussart
- **Filter:** u. a. `haftform`, `altersgruppe`, `haftart` (Untersuchungshaft, Freiheitsstrafe inkl. EFS, …)
- **Aggregation:** `utils/aggregations.ts` — berechnet Kennzahlen aus gefilterten `EducationMeasureRecord`
- **Soll-Plätze:** Mindest-Soll Erwachsene aus `data/catalog.ts` (BASIS-Excel)
- **Schulische Bildung:** Teilnehmende / Gesamtinsassen (Demo-Operationaldaten)
- **Auslastung:** Teilnehmende / Soll-Plätze je Filterauswahl
- **Berichtszeitraum:** Default `2026-Q1` wenn leer; Trend über 2025-Q2 … 2026-Q1
- **Kurs-Überkategorie wechseln:** setzt Kursgrundbezeichnung zurück

## Demo-Datensatz (`data/demoData.ts`)
- **35 JVAs** — jede mit Operationaldaten (Insassen, Beschäftigung, Personal, eLis)
- **Alle Kurstypen** aus BASIS-Katalog; je JVA realistische Teilmenge (größere Anstalten mehr Angebote)
- **Dashboard-Zeiträume:** 2025-Q2 … 2026-Q1 (`REPORTING_PERIODS`)
- **Maßnahmen-Historie:** Quartale 2015-Q1 … 2026-Q2, Records je Geschlecht (`männlich`/`weiblich`) und Altersgruppe (`Erwachsenenvollzug`/`Jugendvollzug`); Jugendliche mit kleineren Teilnehmerzahlen
- Beendigungsgründe RB-01–VB-08, Abschlussarten nach Kurskategorie; Demo-Freitexte bei VB-01 und VB-08
- **Kursangebot JVA:** Spalten Kursleitung (intern/extern) und Maßnahmenbeginn (fortlaufend / Stichtag mit Datum(en))

## Bericht 3a — Schulteilnehmende (landesweit)
- Kachel in `BerichteApp` (`reports.ts` Key `schulteilnehmende-landesweit`, nur Ministerium)
- Eigene Vorschau `SchulteilnehmendeLandesweitView` + PDF + Excel, **ohne** Kennzahlen-Dashboard
- Stichtag: nur abgeschlossene Perioden; Default `2026-Q2`; Jahresdaten letztes abgeschlossenes Jahr (`2025` vs `2024`)
- Pro Altersgruppe: 3 Summen-Charts (5Q / 13M / 11J) + 10 Kategorie-Charts (SF inkl. SO, VM, SA, ST, AB × Geschlecht) + Quartals-/Jahrestabellen
- Logik in `utils/schulteilnehmende.ts`

## Bericht 3b — Schulteilnehmende einer JVA
- Kachel `schulteilnehmende-jva`: Ministerium (beliebige JVA) und Anstaltsrolle (nur eigene JVA)
- Navigation unter **Ergänzende Berichte JVA**; Berichtstyp, JVA, Stichtag und Altersgruppe in der Konfiguration
- Vorschau und Export nur für die gewählte Altersgruppe und vorhandene Angebote
- Unterzeile ohne Berichtsnummer und JVA-Namen (stehen in der Überschrift); nur Berichtszeitpunkt und Jahresdaten
- Gleiche Grafiken/Tabellen wie 3a, aber nur Kurse/Kategorien/Altersgruppen, die in der Anstalt vorkommen
- Landesweiter Vergleich als **NRW-Durchschnitt je Anstalt** (gestrichelte Linien; Tabellenspalten NRW-Ø und % zu NRW-Ø)

## Bericht 4a — Auslastungsquote (landesweit)
- Kachel `auslastungsquote-landesweit`, nur Ministerium, eigene Vorschau + PDF + Excel
- Pro Altersgruppe: 3 Summen-Charts (5Q / 13M / 11J, Linien weiblich/männlich/Summe) + 2 Kategorie-Charts (weiblich/männlich, je 6 Linien: SF, VM, SA, ST, AB, SO)
- **Tabellen** (`AuslastungsquoteTables.tsx`): Quartal (Nachtblau 15/30 %) und Jahr (Nachtblau 30/50 %), Querformat-PDF
  - Quartal: Auslastung beide Geschlechter (aktuelles Q.); je Geschlecht Auslastung (aktuell/letztes Q./Vorjahres-Q., % zum letzten Q., % zum Vorjahres-Q.) und Soll-Plätze (aktuell, Vorjahres-Q., absolute Veränderung)
  - Jahr: Auslastung beide Geschlechter im abgeschlossenen Jahr; je Geschlecht Auslastung (aktuell/Vorjahr/% ) und Soll-Plätze (aktuell/Vorjahr/absolute Veränderung)
  - Negative Veränderungen rot; Kategoriesummen und Gesamtsumme aus aggregierten Teilnehmenden/Soll-Plätzen
- Jahresreihen nur abgeschlossene Jahre (`2025` bei Stichtag `2026-Q2`); Logik in `utils/auslastungsquote.ts`

## Bericht 4b — Auslastungsquote einer JVA
- Kachel `auslastungsquote-jva`: Ministerium (beliebige JVA) und Anstaltsrolle (nur eigene JVA)
- Unterzeile wie 3b ohne Berichtsnummer und JVA-Namen
- Gleiche Grafiken/Tabellen wie 4a, aber nur Kurse/Kategorien/Altersgruppen, die in der Anstalt vorkommen
- Landesweiter Vergleich als **NRW-Auslastung der jeweiligen Vergleichsgruppe** (gleiche Kurstypen; gestrichelte Linien; Tabellenspalten NRW-Ø und % zu NRW-Ø)

## Bericht 5a — Beendigungsgründe (landesweit)
- Kachel `beendigungsgruende-landesweit`, nur Ministerium, eigene Vorschau + PDF + Excel
- Pro Altersgruppe: 3 Übersichts-Charts (5Q / 13M / 11J, je 6 Linien: vorzeitig/regulär × weiblich/männlich/Summe) + 2 Charts reguläre Gründe (w/m, je 3 Linien) + 2 Charts vorzeitige Gründe (w/m, je VB-01–VB-08)
- **Tabellen:** Quartal (Nachtblau 15/30 %, relative %) und Jahr (Nachtblau 30/50 %, absolute Veränderung); negative Werte in Landesrot; Summenzeilen je Beendigungsart
- Freitextliste für das abgeschlossene Jahr (Demo: VB-01 und VB-08); Logik in `utils/beendigungsgruende.ts`

## Bericht 5b — Beendigungsgründe einer JVA
- Kachel `beendigungsgruende-jva`: Ministerium (beliebige JVA) und Anstaltsrolle (nur eigene JVA)
- Unterzeile wie 3b ohne Berichtsnummer und JVA-Namen
- Gleiche Grafiken/Tabellen wie 5a, aber nur Altersgruppen, Geschlechter und Gründe, die in der Anstalt vorkommen
- Landesweiter Vergleich als **NRW-Durchschnitt je Anstalt** (gestrichelte Linien; Tabellenspalten NRW-Ø und % zu NRW-Ø)

## Bericht 6a — Erreichte Schulabschlüsse (landesweit)
- Kachel `schulabschluesse-landesweit`, nur Ministerium, eigene Vorschau + PDF + Excel
- Pro Altersgruppe: 1 Summen-Chart (11 Jahre, weiblich/männlich/Summe) + 3 Detail-Charts (weiblich, männlich, Summe beide Geschlechter) mit Abschlussarten ESA/EESA, MSA, Fachhochschulreife, Hochschulreife, Fachhochschulabschluss, Hochschulabschluss + Summe
- **Jahrestabelle** (blau): aktuelles vs. Vorjahr, Anteil am jeweiligen Geschlecht, relative Veränderung (negativ rot)
- Jahresreihen nur abgeschlossene Jahre (`2025` bei Stichtag `2026-Q2`); Logik in `utils/schulabschluesse.ts`

## Bericht 6b — Erreichte Schulabschlüsse einer JVA
- Kachel `schulabschluesse-jva`: Ministerium (beliebige JVA) und Anstaltsrolle (nur eigene JVA)
- Unterzeile wie 3b ohne Berichtsnummer und JVA-Namen
- Gleiche Grafiken/Tabelle wie 6a, aber nur Altersgruppen, Geschlechter und Abschlussarten, die in der Anstalt vorkommen
- Landesweiter Vergleich als **NRW-Durchschnitt je Anstalt** (gestrichelte Linien; Tabellenspalten NRW-Ø und % zu NRW-Ø)

## Bericht 7 — Kursangebote (landesweit)
- Kachel `kursangebote-landesweit` (Bildungsbroschüre Teil 2), für Ministerium und Anstaltsrolle, eigene Vorschau + PDF + Excel
- Jährliche Übersicht, eine Sektion je JVA; Tabellen nach Geschlecht und Altersgruppe, nur aktive Angebote
- Spalten: Hauptkategorie, Maßnahmenkategorie, Name Kurs, SOLL-Plätze (BASIS), Dauer/Beginn/vorgesehener Abschluss (Web-Erfassung)
- Spalte **Durchführung durch externe Kraft** nur für Ministeriumsrolle (JM, FB Päd., ZBI); Logik in `utils/kursangebote.ts`

## Bericht 8 — Veränderung der Schulkurse und deren Soll-Plätze
- Kachel `sollplaetze-veraenderung`, nur Ministerium (FB Päd.), eigene Vorschau + PDF + Excel
- Monatlicher Abgleich aktueller Monat vs. Vormonat je JVA und Kurs (aus BASIS)
- **Rot:** veränderte Soll-Plätze, **grün:** neu eingerichteter Kurs, **schwarz:** unverändert; Zeile Gesamtsumme
- Logik in `utils/sollplatzVeraenderung.ts`

## Bericht 9 — Schulräume
- Kachel `schulraeume-landesweit`, nur Ministerium (inkl. FB Päd.), eigene Vorschau + PDF + Excel
- Tabelle **Übersicht der Schulräume**: JVA, Raumbezeichnung, Anzahl Räume, Größe in qm, eLis (1/0), Schulplätze; Summe je JVA und Gesamtsumme
- Daten jährlich von den Anstalten im Webformular zu prüfen; Demo aus `demoSchoolRooms`; Logik in `utils/schulraeume.ts`

## Bericht 10 — Stellen
- Kachel `stellen-landesweit`, nur Ministerium (inkl. FB Päd.), eigene Vorschau + PDF + Excel
- Tabelle **Stellen pädagogischer Dienst**: JVA, Anzahl Stellen, davon besetzt, Summenzeile
- Demo aus Operationaldaten (`paedStellen` / `paedBesetzt`); Produktivbetrieb nur, sofern die Stellendaten geliefert werden; Logik in `utils/stellen.ts`

## Bericht 11 — elis Räume und Mandantschaften
- Kachel `elis-raeume-mandantschaften`, nur Ministerium (inkl. FB Päd.), eigene Vorschau + PDF
- Tabelle mit Mandantschaften (Name, Kürzel, gemeldete Anzahl, rabattierte Zählung), Schulräumen, digitalen Sozialräumen, Rektorin/Rektor und Anmerkungen; Summe je JVA und Gesamtsumme
- Demo aus Operationaldaten (eLis-Kennzahlen), aufgeteilt auf Mandantschaften je Anstalt; Logik in `utils/elisRaume.ts`

## Bericht 12 — elis Ansprechpersonen
- Kachel `elis-ansprechpersonen`, nur Ministerium (inkl. FB Päd.), eigene Vorschau + PDF + Excel
- Tabelle **Elis (Stand …)**: JVA (elis-Verbünde, gV/oV), Rektorin/Rektor, Elis Sicherheitsrahmen (AL/VL, Päd. D., Technisch, Sonstige), Elis Sicherheitspartner (AL/VL, Päd. D., Päd. Vertreter, Technisch, Sonstige), Anmerkungen
- Hinweis „Nur auf Ebene Ministerium (inkl. FB Päd.) abrufbar“; Demo-Namen je Anstalt/Vollzugsform; Logik in `utils/elisAnsprechpersonen.ts`

## Leerer Modus
- **NRW-Übersicht:** `OperationalSummaryPanels` (Personal/eLis landesweit summiert) unter den Charts; Tabellen „Personal & eLis nach Anstalt“, „Alle Anstalten“ und „Freie Plätze“ entfernt
- **KPI-Karten:** Vorperioden-Vergleich; **Freie Plätze** → Detail-Modal; **Beschäftigungsquote gesamt** → Sidebar „Beschäftigungsquote“
- **JVA-Stammdatenblatt (Schulische Bildung):** KPI-Reihenfolge wie NRW-Dashboard; Charts: Auslastung nach Kurs + Entwicklung Auslastungsquote, darunter Zielerreichungen/Vorzeitige Beendigungen/Beendigungsgründe
- Ohne Demo-Toggle: KPIs `—`, leere Charts/Tabellen (keine erfundenen Zahlen)

## Design
- **KERN UX-Standard** als Komponentenbasis ([OpenCoDE GitLab](https://gitlab.opencode.de/kern-ux))
- **NRW-Landesdesign 09/2025** ([land.nrw/design-manual](https://www.land.nrw/design-manual), Orientierung [recht.nrw.de](https://recht.nrw.de/)): Basisfarben Nachtblau `#003064` (15 % `#D9E0E8`, 30 % `#B3C1D1`, 50 % `#8098B2`), Schwarz, Weiß. Landesgrün `#009036` und Landesrot `#E2001A` nur für Erfolg/Fehler. Grasgrün `#175E54`, Petrolgrün `#009B74`, Farngrün `#76B828` nur als Zusatz in Diagrammen, wenn Nachtblau nicht reicht. Tokens in `src/index.css`, Charts in `src/ui/chartTheme.ts`. Tabellen: Quartal 15/30 %, Jahr 30/50 % Nachtblau.

## Nächste Schritte (optional)
- Echte BASIS-API-Anbindung
- Deployment via `.env` vom Desktop
- **Power BI:** `PowerBI_Kennzahlen_Spezifikation.md` / `.docx` — Kennzahlenlogik, Datenmodell, DAX-Muster; Word via `python3 scripts/md_to_docx.py`
