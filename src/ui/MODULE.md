# UI (KERN UX)

## Verantwortung
Öffentliche UI-Fassade auf Basis des [KERN UX-Standards](https://gitlab.opencode.de/kern-ux). Fachliche Screens importieren Komponenten nur über `src/ui/kern.ts`, nicht direkt aus `@kern-ux-annex/kern-react-kit`.

## Quellen
- CSS, Schriften, HTML-Referenz: [`@kern-ux/native`](https://gitlab.opencode.de/kern-ux/kern-ux-plain) (npm)
- React-Komponenten: [`@kern-ux-annex/kern-react-kit`](https://gitlab.opencode.de/kern-ux/community/kern-react-kit) (Community, React 18/19)
- Dokumentation: [kern-ux.de/komponenten](https://www.kern-ux.de/komponenten), [React-Kit Storybook](https://kern-react-kit-75d4e7.usercontent.opencode.de/)

## Nutzung
Neue Oberflächen (Formulare, Buttons, Karten, Kopfzeile) mit KERN-Komponenten umsetzen. Im Kennzahlensystem gilt das für Rahmen, Hub, Filter, KPI-Karten, Tabellen und Aktionsbuttons. Grafiken bleiben Recharts, nutzen aber NRW-Nachtblau mit Grün nur als Zusatzserie (`src/ui/chartTheme.ts`).

Für die App-Navigation (Kennzahlensystem, Web-Erfassung, Berichte, Beschäftigungsportal) liegt über der Justiz-Seitenleiste die horizontale Hauptbereichsleiste (`AppAreaBar` in `AppShellLayout` bzw. als `nav` in `KernAppChrome`). Der aktive Bereich ist Nachtblau 50 % mit weißem unteren Randstreifen. Die **Brotkrumennavigation** (`AppBreadcrumb`) zeigt den Pfad der aktuellen Seite; KERN native enthält keine Breadcrumb-Komponente, daher eine semantische `nav`/`ol`-Leiste mit KERN-Typografie. KERN native enthält kein Sidebar-Pattern; das Community-Kit-Addon `KernSidebar` ist nur eine `nav`/`ul`-Hülle. Die Seitenleiste nutzt deshalb KERN-Buttons, -Icons und -Typografie (Fira Sans) auf Nachtblau. Formulare im Berichtsbereich nutzen `KernSelect` und `KernCheckbox`.

## Farbklima
KERN-Komponenten bleiben strukturell erhalten. Farben folgen dem NRW-Landesdesign (09/2025): Basisfarben Nachtblau `#003064` (15/30/50 %), Schwarz und Weiß; Landesgrün und -rot nur für Feedback. Grasgrün, Petrolgrün und Farngrün nur als Zusatz in Diagrammen. Tokens in `src/index.css` und `src/ui/chartTheme.ts`. Kartenflächen weiß (`--kern-color-layout-background-default-surface`); aktiver Sidebar-Eintrag Nachtblau 50 %.

## Abhängigkeiten
Nur fachlich neutrale Präsentation. Keine Fachlogik in diesem Modul.
