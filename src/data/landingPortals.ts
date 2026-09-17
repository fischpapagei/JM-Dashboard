export type LandingPortalId = 'beschaeftigungsportal' | 'bildungsangebote';

export interface LandingPortal {
  id: LandingPortalId;
  title: string;
  subline: string;
  description: string;
  buttonLabel: string;
  href?: string;
}

export const LANDING_PORTALS: LandingPortal[] = [
  {
    id: 'beschaeftigungsportal',
    title: 'Beschäftigungsportal Justizvollzug',
    subline: 'Berufliche Integration',
    description:
      'Das Beschäftigungsportal soll eine Hilfestellung für die Leitungen der Abteilung Berufliche Integration in den Justizvollzugsanstalten des Landes Nordrhein-Westfalen sowie für die Rektorinnen und Rektoren des Pädagogischen Dienstes darstellen.',
    buttonLabel: 'Zum Portal',
  },
  {
    id: 'bildungsangebote',
    title: 'Bildungsangebote in den Justizvollzugsanstalten des Landes Nordrhein-Westfalen',
    subline: 'Angebotsübersicht',
    description:
      'Bildungsangebote in den Justizvollzugsanstalten des Landes Nordrhein-Westfalen.',
    buttonLabel: 'Zu den Bildungsangeboten',
  },
];
