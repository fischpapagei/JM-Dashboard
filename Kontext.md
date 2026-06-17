# Kontext Kennzahlensystem Schulische Bildung NRW

## Stand
- Vite + React 19 + TypeScript + Tailwind v4 + Recharts
- `npm run build` erfolgreich

## UI-Struktur
- **Auth:** `ministerium`/`jm2026` (Landesübersicht), `jva-<slug>`/`jva2026` (nur eigene JVA)
- **Shell:** SidebarLayout, Layout, ProtectedApp (Nav, Demo-Modus, Filter-State)
- **Sidebar (Ministerium):** vier NRW-Dashboards + JVA-Stammdatenblatt — Konfiguration in `data/dashboardAreas.ts`:
  1. **Schulische Bildung** (aufklappbar): Hub-Übersicht → „NRW gesamt“ oder „JVA-Stammdatenblatt · Schulische Bildung“
  2. Berufliche Bildung
  3. Arbeit und Arbeitstherapie
  4. Beschäftigungsquote
  (NRW-Dashboards 2–4 + separates JVA-Stammdatenblatt unverändert)
- **Ansichten:** NrwOverview, JvaDetail — beide nutzen `hooks/useDashboardData.ts`

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
- **4 Quartale** pro Maßnahme für Verlaufsdiagramm
- Beendigungsgründe RB-01–VB-07, Abschlussarten nach Kurskategorie
- **Kursangebot JVA:** Spalten Kursleitung (intern/extern) und Maßnahmenbeginn (fortlaufend / Stichtag mit Datum(en))

## Leerer Modus
- **NRW-Übersicht:** `OperationalSummaryPanels` (Personal/eLis landesweit summiert) unter den Charts; Tabellen „Personal & eLis nach Anstalt“, „Alle Anstalten“ und „Freie Plätze“ entfernt
- **KPI-Karten:** Vorperioden-Vergleich; **Freie Plätze** → Detail-Modal; **Beschäftigungsquote gesamt** → Sidebar „Beschäftigungsquote“
- **JVA-Stammdatenblatt (Schulische Bildung):** KPI-Reihenfolge wie NRW-Dashboard; Charts: Auslastung nach Kurs + Entwicklung Auslastungsquote, darunter Zielerreichungen/Vorzeitige Beendigungen/Beendigungsgründe
- Ohne Demo-Toggle: KPIs `—`, leere Charts/Tabellen (keine erfundenen Zahlen)

## Design
- Sidebar `#1a3352`, aktiv `#2d5a8e`, Main `#eef1f6`

## Nächste Schritte (optional)
- Echte BASIS-Web-API-Anbindung
- Deployment via `.env` vom Desktop
- **Power BI:** `PowerBI_Kennzahlen_Spezifikation.md` / `.docx` — Kennzahlenlogik, Datenmodell, DAX-Muster; Word via `python3 scripts/md_to_docx.py`
