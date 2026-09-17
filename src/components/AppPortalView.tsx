import { LANDING_PORTALS, type LandingPortalId } from '../data/landingPortals';
import { KernAppChrome } from '../ui/KernAppChrome';
import { AppAreaBar } from '../ui/AppAreaBar';
import { AppBreadcrumb } from '../ui/AppBreadcrumb';
import type { MainAppArea } from '../data/appAreas';
import { KernAlert, KernButton, KernContainer, KernHeading, KernSpace, KernText } from '../ui/kern';

interface AppPortalViewProps {
  portalId: LandingPortalId;
  userName: string;
  onBackToLanding: () => void;
  onLogout: () => void;
  onSelectArea: (area: MainAppArea) => void;
}

export function AppPortalView({
  portalId,
  userName,
  onBackToLanding,
  onLogout,
  onSelectArea,
}: AppPortalViewProps) {
  const portal = LANDING_PORTALS.find((item) => item.id === portalId);

  return (
    <KernAppChrome
      actions={
        <>
          <span className="hidden text-sm text-white sm:inline">{userName}</span>
          <KernButton type="button" variant="tertiary" label="Abmelden" onClick={onLogout} />
        </>
      }
      nav={<AppAreaBar active={portalId === 'beschaeftigungsportal' ? 'beschaeftigungsportal' : null} onSelect={onSelectArea} />}
    >
      <KernContainer>
        <KernSpace size="large" />
        <AppBreadcrumb
          items={[
            { id: 'start', label: 'Startseite', onSelect: onBackToLanding },
            { id: 'portal', label: portal?.title ?? 'Portal' },
          ]}
        />
        <KernButton
          type="button"
          variant="tertiary"
          icon="arrow-back"
          label="Zur Startseite"
          onClick={onBackToLanding}
        />
        <KernSpace size="default" />
        <KernHeading level={1}>{portal?.title ?? 'Portal'}</KernHeading>
        {portal ? <KernText>{portal.description}</KernText> : null}
        <KernSpace size="large" />
        <KernAlert title="Portal folgt" variant="info">
          Die Anbindung dieses Portals ist noch nicht hinterlegt. Der Einstieg bleibt auf der
          Startseite vorbereitet.
        </KernAlert>
        <KernSpace size="large" />
      </KernContainer>
    </KernAppChrome>
  );
}
