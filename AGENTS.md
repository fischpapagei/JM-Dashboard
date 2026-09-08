# Verbindliche Entwicklungs- und Architekturregeln

## Arbeitsweise
1. Lies vor Änderungen:
   - diese Datei,
   - die relevanten Architekturentscheidungen,
   - die MODULE.md der betroffenen Module.
2. Erstelle vor der Umsetzung einen Plan.
3. Ändere nur den beauftragten Use Case.
4. Erkläre, bevor du:
   - ein neues Modul erstellst,
   - eine neue externe Abhängigkeit installierst,
   - eine öffentliche Schnittstelle änderst,
   - eine Datenbankmigration anlegst,
   - Modulgrenzen veränderst,
   - einen neuen Deployment-Service erstellst.
5. Führe nach Änderungen Tests, Linting, Typprüfung und Architekturprüfungen aus.

## Fachliche Struktur
Die Anwendung ist nach fachlichen Domänen gegliedert, nicht primär nach technischen Schichten. Jedes fachliche Modul besitzt:
- eine klar beschriebene Verantwortung,
- eigene Use Cases,
- ein eigenes Domänenmodell,
- definierte öffentliche Schnittstellen,
- Verantwortung für seine Daten,
- eigene Tests,
- eine MODULE.md.
Neue Funktionen werden möglichst als Vertical Slice umgesetzt.

## Abhängigkeitsregeln
- Module verwenden andere Module nur über deren öffentliche Schnittstellen.
- Direkte Importe interner Dateien anderer Module sind verboten.
- Zyklische Abhängigkeiten sind verboten.
- Gemeinsamer Code darf nur in `platform` oder `shared` liegen, wenn er tatsächlich fachlich neutral ist.
- Fachlogik darf nicht von UI, Datenbank, Framework oder KI-Modell abhängen.
- Ein neues Shared-Modul erfordert eine Begründung.

## Datenhoheit
- Jedes fachliche Modul ist für seine eigenen Daten verantwortlich.
- Andere Module dürfen diese Daten nicht direkt verändern.
- Direkte Cross-Schema-Zugriffe sind verboten.
- Modulübergreifende Kommunikation erfolgt über öffentliche APIs oder definierte Events.
- Datenbankänderungen erfolgen ausschließlich über Migrationen.
- Bestehende produktive Daten müssen bei Migrationen berücksichtigt werden.

## Fachlogik
- Verbindliche Regeln werden deterministisch im Anwendungscode umgesetzt.
- Statusübergänge müssen ausdrücklich definiert und getestet sein.
- Berechtigungen werden serverseitig bei jedem Use Case geprüft.
- UI-Prüfungen ersetzen keine serverseitigen Prüfungen.
- Kritische Operationen müssen wiederholungssicher beziehungsweise idempotent sein.
- Zusammengehörige Änderungen werden transaktional ausgeführt.

## Schnittstellen und Verträge
- APIs, Events und Agentenwerkzeuge besitzen typisierte Ein- und Ausgaben.
- Alle externen Eingaben werden validiert.
- Öffentliche Verträge dürfen nicht unbemerkt inkompatibel geändert werden.
- Events beschreiben abgeschlossene fachliche Tatsachen.
- Ereignisse und Schnittstellen müssen versionierbar sein.

## KI-Agenten
- KI-Ausgaben gelten immer als nicht vertrauenswürdige Eingaben.
- KI entscheidet nicht abschließend über Berechtigungen oder Fachregeln.
- Agenten verwenden eng begrenzte, typisierte Domain Tools.
- Agenten erhalten keinen allgemeinen Datenbankzugriff.
- Agenten erhalten keine universellen Schreib- oder API-Werkzeuge.
- Schreibende und kritische Aktionen benötigen eine erneute deterministische Prüfung.
- Werkzeugaufrufe und Ergebnisse werden nachvollziehbar protokolliert.
- Für riskante Aktionen ist eine menschliche Freigabe vorzusehen.

## Sicherheit
- Keine Zugangsdaten, Tokens oder Schlüssel im Quellcode.
- Alle Eingaben werden validiert.
- Zugriff wird nach dem Prinzip der geringsten Berechtigung vergeben.
- Fehlermeldungen dürfen keine internen oder vertraulichen Daten offenlegen.
- Personenbezogene Daten werden nur zweckgebunden verarbeitet.
- Sicherheitsrelevante Aktionen werden revisionsfähig protokolliert.

## Tests
Jeder Use Case benötigt mindestens Tests für:
- den erfolgreichen Ablauf,
- ungültige Eingaben,
- fehlende Berechtigungen,
- unzulässige Statusübergänge,
- relevante Fehlerfälle,
- Wiederholung kritischer Operationen.
Fehlerhafte Tests dürfen nicht gelöscht oder abgeschwächt werden, nur damit eine Änderung erfolgreich erscheint.

## Fertigstellung
Eine Änderung ist erst abgeschlossen, wenn:
- die Anforderung erfüllt ist,
- relevante Tests erfolgreich sind,
- Typprüfung und Linting erfolgreich sind,
- Modulgrenzen eingehalten werden,
- Verträge und Dokumentation aktualisiert sind,
- Sicherheits- und Berechtigungsauswirkungen geprüft wurden,
- keine bekannten kritischen Fehler verbleiben.

## Projektstand (Frontend-Prototyp)
Dieses Repository ist aktuell eine Vite/React-Oberfläche ohne getrennte Backend-Module. Fachlicher Kontext steht in `Kontext.md`. Typprüfung über `npm run build`.
