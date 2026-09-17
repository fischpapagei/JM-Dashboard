import type { AuthUser } from '../types/auth';
import type { AppModule } from '../types/app';
import type { MainAppArea } from '../data/appAreas';
import { LANDING_PORTALS, type LandingPortal } from '../data/landingPortals';
import { AppAreaBar } from '../ui/AppAreaBar';
import { AppBreadcrumb } from '../ui/AppBreadcrumb';
import { KernAppChrome } from '../ui/KernAppChrome';
import {
  KernBadge,
  KernButton,
  KernCard,
  KernColumn,
  KernContainer,
  KernHeading,
  KernRow,
  KernSpace,
  KernText,
} from '../ui/kern';

interface LandingPageProps {
  user: AuthUser;
  onSelectModule: (module: Exclude<AppModule, 'landing'>) => void;
  onSelectArea: (area: MainAppArea) => void;
  onLogout: () => void;
}

function openPortal(portal: LandingPortal) {
  if (!portal.href) return;
  window.open(portal.href, '_blank', 'noopener,noreferrer');
}

export function LandingPage({ user, onSelectModule, onSelectArea, onLogout }: LandingPageProps) {
  const isJvaRole = user.role === 'jva';

  return (
    <KernAppChrome
      actions={
        <>
          <span className="hidden text-sm text-white sm:inline">{user.displayName}</span>
          <KernButton type="button" variant="tertiary" label="Abmelden" onClick={onLogout} />
        </>
      }
      nav={<AppAreaBar active={null} onSelect={onSelectArea} />}
    >
      <KernContainer>
        <KernSpace size="large" />
        <AppBreadcrumb items={[{ id: 'start', label: 'Startseite' }]} />
        <KernHeading level={1}>Willkommen</KernHeading>
        <KernText>
          Wählen Sie Kennzahlen, Berichte, die Web-Erfassung oder eines der Portale für Ihre JVA.
        </KernText>
        <KernSpace size="large" />
        <KernRow>
          <KernColumn sizes={{ xs: 12, md: 4 }}>
            <KernCard
              title="Kennzahlensystem"
              subline="Auswertung"
              footer={
                <KernButton
                  type="button"
                  variant="primary"
                  label="Zum Dashboard"
                  onClick={() => onSelectModule('kennzahlen')}
                />
              }
            >
              Landes- und anstaltsbezogene Auswertungen, Dashboards und Vergleiche — Daten aus
              BASIS.
            </KernCard>
          </KernColumn>
          <KernColumn sizes={{ xs: 12, md: 4 }}>
            <KernCard
              title="Berichte"
              subline="PDF und Excel"
              footer={
                <KernButton
                  type="button"
                  variant="primary"
                  label="Zu den Berichten"
                  onClick={() => onSelectModule('berichte')}
                />
              }
            >
              Berichte konfigurieren und als PDF oder Excel erzeugen — Kurzberichte und weitere
              Auswertungen nach Zeitraum und Anstalt.
            </KernCard>
          </KernColumn>
          <KernColumn sizes={{ xs: 12, md: 4 }}>
            <KernCard
              title="Web-Erfassung"
              subline="Dateneingabe"
              footer={
                <KernButton
                  type="button"
                  variant="primary"
                  label="Zur Erfassung"
                  onClick={() => onSelectModule('weberfassung')}
                />
              }
            >
              {isJvaRole ? <KernBadge label="Ihre Anstalt" variant="info" /> : null}
              {isJvaRole ? <KernSpace size="small" /> : null}
              Erfassung und Pflege von Kennzahlen durch die JVAen — Meldungen für Berichtszeiträume
              vorbereiten und übermitteln.
            </KernCard>
          </KernColumn>
        </KernRow>
        <KernSpace size="large" />
        <KernRow>
          {LANDING_PORTALS.map((portal) => (
            <KernColumn key={portal.id} sizes={{ xs: 12, md: 6 }}>
              <KernCard
                title={portal.title}
                subline={portal.subline}
                footer={
                  <KernButton
                    type="button"
                    variant="primary"
                    label={portal.buttonLabel}
                    onClick={() => {
                      if (portal.href) {
                        openPortal(portal);
                        return;
                      }
                      onSelectModule(portal.id);
                    }}
                  />
                }
              >
                {portal.description}
              </KernCard>
            </KernColumn>
          ))}
        </KernRow>
        <KernSpace size="x-large" />
        <KernText muted size="small">
          Mock-up v2 · Kennzahlensystem = Auswertung · Berichte = PDF und Excel · Web-Erfassung
          = Dateneingabe · Portale = Beschäftigungsportal und Bildungsangebote
        </KernText>
        <KernSpace size="large" />
      </KernContainer>
    </KernAppChrome>
  );
}
