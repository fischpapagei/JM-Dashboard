# UI (KERN UX)

## Verantwortung
Öffentliche UI-Fassade auf Basis des [KERN UX-Standards](https://gitlab.opencode.de/kern-ux). Fachliche Screens importieren Komponenten nur über `src/ui/kern.ts`, nicht direkt aus `@kern-ux-annex/kern-react-kit`.

## Quellen
- CSS, Schriften, HTML-Referenz: [`@kern-ux/native`](https://gitlab.opencode.de/kern-ux/kern-ux-plain) (npm)
- React-Komponenten: [`@kern-ux-annex/kern-react-kit`](https://gitlab.opencode.de/kern-ux/community/kern-react-kit) (Community, React 18/19)
- Dokumentation: [kern-ux.de/komponenten](https://www.kern-ux.de/komponenten), [React-Kit Storybook](https://kern-react-kit-75d4e7.usercontent.opencode.de/)

## Nutzung
Neue Oberflächen (Formulare, Buttons, Karten, Kopfzeile) mit KERN-Komponenten umsetzen. Bestehende Tailwind-Dashboards bleiben vorerst; schrittweise angleichen.

Für die App-Navigation (Kennzahlensystem, Web-Erfassung, Berichte) bleibt die Justiz-Seitenleiste (`JustizSidebar`). KERN native enthält kein Sidebar-Pattern; das Community-Kit-Addon `KernSidebar` ist nur eine `nav`/`ul`-Hülle. Die Leiste nutzt deshalb KERN-Buttons, -Icons und -Typografie (Fira Sans) auf Nachtblau. Formulare im Berichtsbereich nutzen `KernSelect` und `KernCheckbox`.

## Farbklima
KERN-Komponenten bleiben strukturell erhalten. Farben folgen dem Justizportal NRW (Nachtblau, Petrol, Landesgrün) über CSS-Variablen in `src/index.css`.

## Abhängigkeiten
Nur fachlich neutrale Präsentation. Keine Fachlogik in diesem Modul.
