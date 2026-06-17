# Power BI — Kennzahlen-Spezifikation Schulische Bildung NRW

**Stand:** Juni 2026  
**Bezug:** Prototyp „Kennzahlensystem Schulische Bildung NRW“ (React/Vite)  
**Zielgruppe:** Data Scientists / Power-BI-Entwickler  
**Zweck:** Nachvollziehbare Umsetzung aller Kennzahlen, Filter und Visualisierungen in Power BI auf Basis von BASIS-Web-Daten

---

## 1. Überblick

Das Dashboard bildet die schulische Bildung in den JVAs in NRW ab — auf zwei Ebenen:

| Ebene | Ansicht | Organisation |
|-------|---------|--------------|
| Landesübersicht | NRW gesamt | Summierung / Aggregation über alle JVAs |
| JVA-Detail | JVA-Stammdatenblatt | Filter auf eine JVA |

**Kernprinzipien der Berechnung:**

1. **Filter zuerst:** Alle Kennzahlen beziehen sich auf die aktuell gewählte Filterkombination (Zeitraum, JVA, demografische Merkmale, Kursfilter).
2. **Quoten aus Summen:** Auslastung, Beschäftigungsquote etc. werden **nicht** als Mittelwert einzelner Kurse berechnet, sondern aus **aggregierten Zählern** (z. B. SUM(Teilnehmende) / SUM(Soll-Plätze)).
3. **Rundung:** Prozentwerte und Kennzahlen mit einer Nachkommastelle: `ROUND(Wert * 10, 0) / 10` bzw. in DAX: `ROUND(Wert, 1)`.
4. **Leerwerte:** Wenn Nenner = 0 oder Pflichtfelder fehlen → `BLANK()` (UI zeigt „—“).

---

## 2. Empfohlenes Datenmodell (Sternschema)

### 2.1 Faktentabellen

#### `Fact_Bildungsmassnahme` (Kernfakt, granular: 1 Zeile pro JVA × Kurs × Berichtszeitraum × ggf. Merkmalskombination)

| Spalte | Typ | Beschreibung | Quelle |
|--------|-----|--------------|--------|
| `massnahme_id` | Text | Eindeutige ID | BASIS |
| `jva_id` | Text | FK → Dim_JVA | BASIS |
| `berichtszeitraum` | Text | z. B. `2026-Q1` | BASIS |
| `kurs_ueberkategorie_key` | Text | FK → Dim_KursUeberkategorie | BASIS-Katalog |
| `kursgrundbezeichnung_key` | Text | FK → Dim_Kursgrundbezeichnung | BASIS-Katalog |
| `geschlecht` | Text | männlich / weiblich | BASIS |
| `haftform` | Text | offen / geschlossen | BASIS |
| `altersgruppe` | Text | Erwachsenenvollzug / Jugendvollzug | BASIS |
| `haftart` | Text | s. Haftarten-Katalog | BASIS |
| `teilnehmende` | Ganzzahl | Aktuelle Teilnehmende der Maßnahme | BASIS |
| `soll_plaetze` | Ganzzahl | Soll-Plätze (Mindest-Soll Erwachsene aus Katalog) | BASIS-Katalog |
| `abschluesse` | Ganzzahl | Erreichte formale Abschlüsse (nur kursrelevante Maßnahmen) | BASIS |
| `zielerreichungen` | Ganzzahl | Zielerreichungen ohne Regelabschluss | BASIS |
| `regulaere_beendigungen` | Ganzzahl | Beendigungen mit Level-1 „reguläre Beendigung“ | BASIS |
| `vorzeitige_beendigungen` | Ganzzahl | Beendigungen mit Level-1 „vorzeitige Beendigung“ | BASIS |
| `beendigungsgrund_key` | Text | FK → Dim_Beendigungsgrund (RB-01 … VB-07) | BASIS |
| `abschlussart_key` | Text | FK → Dim_Abschlussart (optional) | BASIS |
| `kursleitung` | Text | `intern` / `extern` | BASIS |
| `massnahmenbeginn_typ` | Text | `fortlaufend` / `stichtag` | BASIS |
| `massnahmenbeginn_datum` | Datum | Bei Stichtag: 1:n Datumszeilen oder kommagetrennt in Staging | BASIS |

> **Hinweis:** `terminations` (Gesamtbeendigungen) im Prototyp = `regulaere_beendigungen + vorzeitige_beendigungen`. In Power BI beide Spalten getrennt aus BASIS laden.

#### `Fact_JVA_Operational` (1 Zeile pro JVA × Berichtszeitraum)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `jva_id` | Text | FK → Dim_JVA |
| `berichtszeitraum` | Text | z. B. `2026-Q1` |
| `gesamtinsassen` | Ganzzahl | Gesamtinsassen der JVA |
| `beschaeftigte_gesamt` | Ganzzahl | Beschäftigte (alle Bereiche) |
| `paed_stellen` | Ganzzahl | Pädagogische Stellen (Soll) |
| `paed_besetzt` | Ganzzahl | Pädagogische Stellen besetzt |
| `paed_extern` | Ganzzahl | Externe päd. Kräfte |
| `elis_lernplaetze` | Ganzzahl | eLis-Lernplätze |
| `elis_mandantschaften` | Ganzzahl | eLis-Mandantschaften |
| `elis_digitale_sozialraeume` | Ganzzahl | Digitale Sozialräume (eLis) |
| `elis_haftraeume` | Ganzzahl | eLis-Hafträume |
| `schulraeume` | Ganzzahl | Anzahl Schulräume |
| `elis_schulraeume` | Ganzzahl | Davon eLis-Schulräume |

#### `Fact_Schulraum` (optional, Raumdetail)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `raum_id` | Text | Eindeutige ID |
| `jva_id` | Text | FK |
| `bezeichnung` | Text | Raumname |
| `quadratmeter` | Dezimal | Fläche m² |
| `ist_elis` | Boolean | eLis-Raum ja/nein |

### 2.2 Dimensionstabellen

| Dimension | Inhalt |
|-----------|--------|
| `Dim_JVA` | 35 JVAs: ID, Name, Region, Geschlecht, Haftform, Altersgruppe |
| `Dim_KursUeberkategorie` | SF, VM, SA, ST, AB, SO (s. Katalog) |
| `Dim_Kursgrundbezeichnung` | Alle BASIS-Kursgrundbezeichnungen inkl. Mindest-Soll, Dauer, `has_formal_completion` |
| `Dim_Beendigungsgrund` | RB-01 … RB-03, VB-01 … VB-07 inkl. `level1`, Klassifikation |
| `Dim_Abschlussart` | ESA, MSA, Bachelor, … |
| `Dim_Berichtszeitraum` | Quartale, Monate, Jahre; Hierarchie Jahr → Quartal → Monat |
| `Dim_Haftart` | Untersuchungshaft, Freiheitsstrafe inkl. EFS, … |
| `Dim_Filter` | Hilfstabelle für Slicer-Default „alle“ |

### 2.3 Katalogtabellen (Referenz)

Quelle: `Bildungskennzahlen_schulische Bildung_Drop-down_BASIS.xlsx` bzw. `src/data/catalog.ts`

**Kurs-Überkategorien:**

| Key | Bezeichnung |
|-----|-------------|
| SF | Sprachliche Förderung |
| VM | Vorqualifizierende Maßnahmen |
| SA | Schulabschlussbezogene Maßnahmen |
| ST | Studium |
| AB | Ausbildungsvorbereitung |
| SO | Sonstige |

**Beendigungsgründe Level 1:**

| Level 1 | Keys |
|---------|------|
| Reguläre Beendigung | RB-01, RB-02, RB-03 |
| Vorzeitige Beendigung | VB-01 … VB-07 |

**Soll-Plätze:** Pro `kursgrundbezeichnung_key` das Feld `minimumPlacesAdults` aus dem BASIS-Katalog (Mindest-Soll Erwachsene). Fallback im Prototyp: 8 — in Produktion **nur Katalogwert** verwenden.

---

## 3. Filterlogik (Slicer / REPORT-FILTER)

Alle Kennzahlen müssen auf den gleichen gefilterten Satz angewendet werden.

### 3.1 Filterebenen (wie Prototyp `FilterBar`)

| Nr. | Filter | Werte | Wirkung |
|-----|--------|-------|---------|
| 1 | Zeitraum-Granularität | Monat / Quartal / Jahr | Steuert Berichtszeitraum-Auswahl und Vorperioden-Vergleich |
| 2 | Berichtszeitraum | z. B. `2026-Q1`, `2025`, `2026-03` | Siehe Abschnitt 4 |
| 3 | Organisationsebene | NRW / JVA | NRW = alle JVAs; JVA = eine Anstalt |
| 4 | JVA | JVA-ID oder „alle“ | Nur bei Ebene NRW |
| 5 | Geschlecht | alle / männlich / weiblich | Dimension auf Fakt |
| 6 | Haftform | alle / offen / geschlossen | Dimension auf Fakt |
| 7 | Altersgruppe | alle / Erwachsenenvollzug / Jugendvollzug | Dimension auf Fakt |
| 8 | Haftart | alle / Katalogwerte | Dimension auf Fakt |
| 9 | Kurs-Überkategorie | alle / SF … SO | `kurs_ueberkategorie_key` |
| 10 | Kursgrundbezeichnung | alle / Kursliste | `kursgrundbezeichnung_key`; bei Kategoriewechsel zurücksetzen |
| 11 | Beendigungsgrund | alle / RB-01 … VB-07 | `beendigungsgrund_key` |
| 12 | Abschlussart | alle / Katalog | `abschlussart_key` |

### 3.2 Filterregeln (DAX-Hilfslogik)

```dax
-- Beispiel: Geschlecht-Filter (Slicer-Wert in Dim_Filter[geschlecht])
Geschlecht_Filter =
    SELECTEDVALUE(Dim_Filter[geschlecht], "alle") = "alle"
    || Fact_Bildungsmassnahme[geschlecht] = SELECTEDVALUE(Dim_Filter[geschlecht])
```

**Organisationsebene JVA:** Wenn `jva_id` im Slicer gesetzt → alle Kennzahlen auf diese JVA beschränken. JVA-Rolle (Benutzer) erzwingt feste JVA.

---

## 4. Berichtszeitraum-Auflösung

Die Rohdaten liegen **quartalsweise** vor (`2025-Q2` … `2026-Q1`).

| Gewählter Berichtszeitraum | Aufgelöste Daten-Quartale |
|----------------------------|---------------------------|
| `NULL` / leer | `2026-Q1` (aktuellstes Quartal) |
| `2026-Q1` | `[2026-Q1]` |
| `2025` (Jahr) | `[2025-Q2, 2025-Q3, 2025-Q4]` |
| `2026-03` (Monat) | Quartal des Monats, z. B. `2026-Q1` |

### Mehrperioden-Aggregation (Jahr / mehrere Quartale)

| Kennzahlentyp | Regel bei mehreren Quartalen |
|---------------|------------------------------|
| Absolute Werte (Teilnehmende, Soll, Abschlüsse, …) | **SUM** über alle Quartale |
| Quoten (Auslastung, Abbruchquote) | **Neu berechnen** aus summierten Zählern |
| Beschäftigungsquote, Beschäftigungsquote schul. Bildung | **Durchschnitt** der Periodenwerte (Prototyp-Verhalten) |

### Vorperioden-Vergleich (KPI-Karten)

| Granularität | Vergleichslabel | Vorperiode |
|--------------|-----------------|------------|
| Quartal | Vorquartal | Vorheriges Quartal |
| Monat | Vormonat | Vorheriger Monat (Monatsfilter) bzw. abgeleitetes Quartal |
| Jahr | Vorjahr | Vorheriges Jahr |

Gleiche Filter, nur Berichtszeitraum = Vorperiode.

---

## 5. Kennzahlen — Definitionen (DAX-orientiert)

### 5.1 Hilfsmaße (Basis)

```dax
Teilnehmende :=
    SUM(Fact_Bildungsmassnahme[teilnehmende])

Soll_Plaetze :=
    SUM(Fact_Bildungsmassnahme[soll_plaetze])

Freie_Plaetze :=
    MAX(0, [Soll_Plaetze] - [Teilnehmende])
    -- Nur anzeigen wenn beide Summen nicht BLANK

Auslastungsquote :=
    VAR t = [Teilnehmende]
    VAR s = [Soll_Plaetze]
    RETURN IF(s > 0, ROUND(t / s * 100, 1), BLANK())

Gesamtinsassen :=
  SUM(Fact_JVA_Operational[gesamtinsassen])

Beschaeftigte_Gesamt :=
  SUM(Fact_JVA_Operational[beschaeftigte_gesamt])
```

### 5.2 KPI-Karten — NRW-Übersicht & JVA-Detail

| KPI (UI) | Formel | Einheit | Datenquelle |
|----------|--------|---------|-------------|
| **Freie Plätze** | `[Soll_Plaetze] - [Teilnehmende]`, min. 0 | Anzahl | Fact_Bildungsmassnahme |
| **Teilnehmende / Soll-Plätze** | Zwei Werte: `[Teilnehmende]` und `[Soll_Plaetze]` | Anzahl | Fact_Bildungsmassnahme |
| **Beschäftigungsquote gesamt** | `[Beschaeftigte_Gesamt] / [Gesamtinsassen] * 100` | % | Fact_JVA_Operational |
| **Beschäftigungsquote schulische Bildung** | `[Teilnehmende] / [Gesamtinsassen] * 100` | % | Bildungsmaßnahme + Operational |
| **Auslastungsquote** / **Auslastungsquote schulische Maßnahmen** | `[Auslastungsquote]` | % | Fact_Bildungsmassnahme |
| **Erreichte Schulabschlüsse** | `SUM(abschluesse)` | Anzahl | Nur Maßnahmen mit formalem Abschluss |
| **Zielerreichungen** | `SUM(zielerreichungen)` | Anzahl | Maßnahmen ohne Regelabschluss |
| **Vorzeitige Beendigungen** | `SUM(vorzeitige_beendigungen)` | Anzahl | **Empfohlen aus BASIS** |
| **Abbruchquote** (intern) | `SUM(vorzeitige_beendigungen) / [Teilnehmende] * 100` | % | — |

> **Prototyp-Hinweis:** Im React-Prototyp wird die KPI „Vorzeitige Beendigungen“ derzeit noch über `SUM(terminations)` berechnet. Für Power BI **separates Feld `vorzeitige_beendigungen`** aus BASIS verwenden (wie in der JVA-Kurstabelle).

### 5.3 NRW-Vergleich (JVA-Detail)

| KPI-Typ | NRW-Vergleich |
|---------|---------------|
| **Quoten** (Beschäftigungsquote gesamt, schul. Bildung, Auslastung) | Landesweiter Wert **mit gleichen Filtern**, aber **ohne JVA-Filter** (alle JVAs) |
| **Absolute Kennzahlen** (Freie Plätze, Teilnehmende, Soll, Abschlüsse, Zielerreichungen, Vorzeitige Beendigungen) | **Durchschnitt je JVA** (Ø): Für jede JVA KPI berechnen, dann `AVERAGE` über alle JVAs |

```dax
-- Beispiel NRW-Vergleich Auslastung (Quote)
Auslastung_NRW :=
    CALCULATE([Auslastungsquote], REMOVEFILTERS(Dim_JVA), ALL(Dim_JVA))

-- Beispiel NRW-Vergleich Freie Plätze (Ø je JVA)
Freie_Plaetze_NRW_Avg :=
    AVERAGEX(VALUES(Dim_JVA[jva_id]), [Freie_Plaetze])
```

### 5.4 Operational-Panels (Personal, Schulräume, eLis)

Landesweit / JVA: Summe über `Fact_JVA_Operational` im gewählten Zeitraum.

| Panel-Feld | Formel |
|------------|--------|
| Päd. Dienst | `SUM(paed_besetzt) & " / " & SUM(paed_stellen)` |
| eLis Lernplätze | `SUM(elis_lernplaetze) & " / " & SUM(elis_mandantschaften) & " Mand."` |
| Schulräume | `SUM(schulraeume)` (Detail über `Fact_Schulraum`) |
| eLis-Schulräume | `SUM(elis_schulraeume)` |

---

## 6. Visualisierungen & Berechnungen

### 6.1 Kursangebote nach Überkategorie (NRW)

| Aspekt | Definition |
|--------|------------|
| **X-Achse** | Kurs-Überkategorie (`Dim_KursUeberkategorie[label]`) |
| **Y-Wert** | `SUM(teilnehmende)` je Überkategorie |
| **Sortierung** | Absteigend nach Teilnehmende |
| **Zusatz** | Anzahl Maßnahmen-Zeilen (`COUNTROWS`) je Kategorie |

### 6.2 Entwicklung Auslastungsquote (Zeitverlauf)

| Aspekt | Definition |
|--------|------------|
| **Y-Wert** | `[Auslastungsquote]` pro Zeitabschnitt |
| **Granularität** | Woche / Monat / Quartal / Jahr (umschaltbar) |
| **Quartal/Jahr** | Echte Aggregation aus Quartalsdaten |
| **Monat/Woche (Produktion)** | **Monatliche/wöchentliche Rohdaten aus BASIS** bevorzugen |
| **Trendlinie** | Lineare Regression (OLS) über die angezeigten Y-Werte; Formel siehe Anhang A |

> **Prototyp:** Monats-/Wochenwerte werden aus Quartals-Auslastung mit Faktoren interpoliert (Demo). In Power BI **nicht** übernehmen, sobald echte Zeitreihen verfügbar sind.

### 6.3 Beendigungsgründe

| Aspekt | Definition |
|--------|------------|
| **Wert** | `COUNTROWS` gefilterter Maßnahmen-Zeilen **pro Beendigungsgrund** |
| **Alternative (empfohlen bei BASIS)** | `SUM` der Beendigungen je Grund, falls mehrere Beendigungen pro Maßnahme-Zeile möglich |
| **Sortierung** | Absteigend |
| **Achse** | `Dim_Beendigungsgrund[label]` |

### 6.4 Auslastung nach Kurs (JVA)

| Aspekt | Definition |
|--------|------------|
| **Ebene** | `Dim_Kursgrundbezeichnung` (Kurzlabel in UI) |
| **Wert** | `teilnehmende / soll_plaetze * 100` **je Kurszeile** |
| **Sortierung** | Absteigend nach Auslastung % |
| **X-Achse** | „Auslastung in %“, Domain 0–100 |
| **Beschriftung** | Prozentwert am Balken |

### 6.5 JVA-Kurstabelle

Eine Zeile pro angebotener Maßnahme (JVA × Kursgrundbezeichnung × Berichtszeitraum nach Filter).

| Spalte | Quelle / Formel |
|--------|-----------------|
| Überkategorie | `Dim_KursUeberkategorie[label]` |
| Kursgrundbezeichnung | `Dim_Kursgrundbezeichnung[label]` |
| Kursleitung | `intern` / `extern` |
| Maßnahmenbeginn | `fortlaufend` oder Datum(e) bei Stichtag |
| Dauer | Katalogfeld `duration` |
| Teilnehmende | `teilnehmende` |
| Soll-Plätze | `soll_plaetze` |
| Auslastung | `ROUND(teilnehmende/soll_plaetze*100, 1)` |
| Reguläre Beendigung | `regulaere_beendigungen` |
| Vorzeitige Beendigung | `vorzeitige_beendigungen` |

### 6.6 Freie Plätze — Detailmodal (NRW)

Zeilen mit `freie_plaetze > 0`, sortiert absteigend. Felder: JVA, Überkategorie, Kurs, Geschlecht, Haftform, Altersgruppe, Haftart, Freie Plätze.

---

## 7. DAX-Muster für Power BI

### 7.1 Gefilterte Basis

```dax
Massnahmen_Gefiltert :=
    Fact_Bildungsmassnahme
    -- Berichtszeitraum-Slicer auf Dim_Berichtszeitraum
    -- + alle weiteren Slicer via Beziehungen
```

### 7.2 Vorperioden-Wert

```dax
Teilnehmende_Vorperiode :=
    CALCULATE(
        [Teilnehmende],
        Dim_Berichtszeitraum[periode_key] = [Ausgewaehlte_Vorperiode]
    )
```

### 7.3 Auslastung je Kurs (für Balkendiagramm)

```dax
Auslastung_Je_Kurs :=
    VAR t = SUM(Fact_Bildungsmassnahme[teilnehmende])
    VAR s = SUM(Fact_Bildungsmassnahme[soll_plaetze])
    RETURN IF(s > 0, ROUND(t / s * 100, 1), BLANK())
```

Kurs als Achse: `Dim_Kursgrundbezeichnung[short_label]` in Visual verwenden.

### 7.4 Reguläre / vorzeitige Beendigung je Kurs

```dax
Regulaere_Beendigung := SUM(Fact_Bildungsmassnahme[regulaere_beendigungen])
Vorzeitige_Beendigung := SUM(Fact_Bildungsmassnahme[vorzeitige_beendigungen])
```

Validierung: `regulaere_beendigungen + vorzeitige_beendigungen ≤ teilnehmende` (plausibilitätsprüfung).

---

## 8. Formatierung

| Typ | Format (de-DE) | Beispiel |
|-----|----------------|----------|
| Ganzzahlen | `#.##0` | 1.234 |
| Prozent | `#.##0,0 %` oder Wert + „ %“ | 71,4 % |
| Verhältnis | `#.##0 / #.##0` | 90 / 126 |
| NRW-Ø | `Ø #.##0` | Ø 20 |
| Datum | `TT.MM.JJJJ` | 15.01.2026 |

---

## 9. Berechtigungskonzept (Rollen)

| Rolle | Sicht |
|-------|-------|
| Ministerium | Alle JVAs, NRW-Dashboards + JVA-Auswahl |
| JVA | Nur eigene `jva_id` (RLS auf `Dim_JVA`) |

Row-Level Security in Power BI:

```dax
-- Rolle JVA
[jva_id] = USERPRINCIPALNAME() -- oder Mapping-Tabelle Benutzer → JVA
```

---

## 10. Datenqualität & offene Klärungen

| Thema | Empfehlung |
|-------|------------|
| Soll-Plätze | Immer aus BASIS-Katalog (Mindest-Soll Erwachsene), nicht manuell |
| Beendigungsgründe | Katalog RB-01–VB-07; Level-1 für Spaltenaufteilung regulär/vorzeitig |
| Monats-/Wochentrend | Echte BASIS-Zeitreihen statt Demo-Interpolation |
| Beendigungschart | Klären: COUNT Maßnahmen vs. SUM Beendigungen |
| KPI Vorzeitige Beendigungen | Feld `vorzeitige_beendigungen` nutzen, nicht Gesamt-`terminations` |
| Maßnahmenbeginn Stichtag | 1:n Datumsrelation oder separate Bridge-Tabelle `Fact_Massnahmenbeginn_Datum` |
| Mehrfachfilter Haftart | Leere Dimensionswerte in Fakt als „alle Merkmale“ behandeln (Prototyp-Verhalten) |

---

## Anhang A — Lineare Trendlinie (OLS)

Für die Visualisierung „Entwicklung Auslastungsquote“ (optional):

Gegeben Werte `y[0] … y[n-1]` mit Index `x = 0 … n-1`:

```
slope     = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)
intercept = (Σy − slope·Σx) / n
trend[i]  = ROUND(slope·i + intercept, 1)
```

In Power BI alternativ: integrierte **Trendlinie** in einem Line-Chart oder `LINESTX`-Funktion.

---

## Anhang B — Mapping Prototyp → Power BI

| Prototyp-Datei | Inhalt für Power BI |
|----------------|---------------------|
| `src/utils/aggregations.ts` | Haupt-KPI- und Chart-Logik |
| `src/utils/calculations.ts` | Basisformeln (Auslastung, freie Plätze, Regression) |
| `src/utils/filters.ts` | Slicer-Filterlogik |
| `src/utils/periods.ts` | Berichtszeitraum-Auflösung, Vorperioden, Trend-Zeitachse |
| `src/data/catalog.ts` | Dimensionen Kurs, Beendigung, Abschluss, Haftart |
| `src/types/domain.ts` | Datenmodell / Spaltennamen |

---

## Anhang C — Checkliste Umsetzung

- [ ] Staging-Tabellen aus BASIS-Web anlegen
- [ ] Sternschema in Power BI modellieren
- [ ] Dim_Berichtszeitraum mit Hierarchie und Vorperioden-Spalte
- [ ] Alle Maße aus Abschnitt 5 als DAX implementieren
- [ ] Slicer gemäß Abschnitt 3 verdrahten
- [ ] NRW- vs. JVA-Ansicht als Lesezeichen oder separate Report-Seiten
- [ ] RLS für JVA-Rollen testen
- [ ] Plausibilität: Auslastung 0–100 %, freie Plätze ≥ 0
- [ ] Abgleich Stichproben mit Prototyp (Demo-Modus) und BASIS-Web

---

*Dokument erzeugt aus dem React-Prototyp „Dashboard Kennzahlen JM“. Bei Abweichungen zwischen Prototyp und fachlicher Vorgabe BASIS-Web gilt die Datenquelle BASIS.*
