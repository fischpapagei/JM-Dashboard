# Kennzahlensystem Schulische Bildung NRW

Interaktiver Prototyp eines Dashboards für Bildungskennzahlen in der schulischen Bildung der Justizvollzugsanstalten (JVAs) in Nordrhein-Westfalen. Das System dient als fachliche und technische Vorlage für eine spätere Anbindung an **BASIS-Web** bzw. eine Umsetzung in **Power BI**.

## Funktionsumfang

- **Landesübersicht (NRW gesamt):** KPI-Karten, Kursangebote nach Überkategorie, Auslastungstrend, Beendigungsgründe, Operational-Panels (Personal, Schulräume, eLis)
- **JVA-Stammdatenblatt:** KPIs, Auslastung nach Kurs, Verlauf der Auslastungsquote, Zielerreichungen, vorzeitige Beendigungen, Kursangebotstabelle mit Kursleitung und Maßnahmenbeginn
- **Drei Ebenen Filter:** Zeitraum/Organisation, demografische Merkmale, Kurs- und Beendigungsfilter
- **Demo-Modus:** realistische Demo-Daten für 35 JVAs und alle Kurstypen aus dem BASIS-Katalog
- **Leerer Modus:** ohne Demo-Toggle werden keine erfundenen Zahlen angezeigt (Vorbereitung für Live-Daten)

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 19, TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |

## Schnellstart

```bash
npm install
npm run dev
```

Die App läuft standardmäßig unter `http://localhost:5173`.

### Weitere Befehle

```bash
npm run build    # Produktions-Build (TypeScript + Vite)
npm run preview  # Build lokal testen
```

## Demo-Zugänge

| Rolle | Benutzername | Passwort | Sicht |
|-------|--------------|----------|-------|
| Ministerium | `ministerium` | `jm2026` | Landesübersicht, alle JVAs |
| JVA | `jva-<slug>` | `jva2026` | Nur eigene Anstalt (z. B. `jva-bielefeld-brackwede`) |

> Die Zugangsdaten sind **nur für den Prototyp** gedacht und dürfen in Produktion nicht verwendet werden.

## Projektstruktur

```
src/
├── components/     # UI (Dashboards, Filter, Charts, Modals)
├── data/           # Katalog, JVAs, Demo-Daten, Benutzer
├── hooks/          # useDashboardData
├── types/          # Domain- und Auth-Typen
└── utils/          # Aggregationen, Filter, Berechnungen, Formatierung

PowerBI_Kennzahlen_Spezifikation.md   # Kennzahlenlogik für Data Scientists
PowerBI_Kennzahlen_Spezifikation.docx  # Word-Version der Spezifikation
scripts/md_to_docx.py                  # Markdown → Word konvertieren
Kontext.md                             # Interner Kontext für Entwicklung
```

## Kennzahlen & Datenquellen

- **Soll-Plätze:** Mindest-Soll Erwachsene aus dem BASIS-Katalog (`Bildungskennzahlen_schulische Bildung_Drop-down_BASIS.xlsx`)
- **Auslastung:** Teilnehmende ÷ Soll-Plätze (aggregiert, nicht als Kursmittelwert)
- **Beschäftigungsquote gesamt:** Beschäftigte ÷ Gesamtinsassen (Operationaldaten)
- **Beschäftigungsquote schulische Bildung:** Teilnehmende ÷ Gesamtinsassen
- **Beendigungsgründe:** Katalog RB-01 bis VB-07

Ausführliche Formeln, Datenmodell (Sternschema) und DAX-Muster: siehe `PowerBI_Kennzahlen_Spezifikation.md`.

Word-Dokument neu erzeugen:

```bash
python3 scripts/md_to_docx.py
```

## Design

- Sidebar: `#1a3352`
- Aktiver Navigationspunkt: `#2d5a8e`
- Hintergrund Hauptbereich: `#eef1f6`

## Status & Roadmap

- [x] UI-Prototyp mit Demo-Daten
- [x] Power-BI-Spezifikation
- [ ] Anbindung BASIS-Web-API
- [ ] Produktives Deployment

## Lizenz

Internes Projekt — Nutzung nach Absprache mit dem Auftraggeber.
