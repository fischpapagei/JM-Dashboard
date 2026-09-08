import type { AuthUser } from '../types/auth';
import type { AppModule } from '../types/app';
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
  onLogout: () => void;
}

export function LandingPage({ user, onSelectModule, onLogout }: LandingPageProps) {
  const isJvaRole = user.role === 'jva';

  return (
    <KernAppChrome
      actions={
        <>
          <span className="hidden text-sm text-white sm:inline">{user.displayName}</span>
          <KernButton type="button" variant="tertiary" label="Abmelden" onClick={onLogout} />
        </>
      }
    >
      <KernContainer>
        <KernSpace size="large" />
        <KernHeading level={1}>Willkommen</KernHeading>
        <KernText>
          Wählen Sie Kennzahlen, Berichte oder die Web-Erfassung für Ihre JVA.
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
              BASIS-Web.
            </KernCard>
          </KernColumn>
          <KernColumn sizes={{ xs: 12, md: 4 }}>
            <KernCard
              title="Berichte"
              subline="PDF-Konfiguration"
              footer={
                <KernButton
                  type="button"
                  variant="primary"
                  label="Zu den Berichten"
                  onClick={() => onSelectModule('berichte')}
                />
              }
            >
              Berichte konfigurieren und als PDF erzeugen — Kurzberichte und weitere Auswertungen
              nach Zeitraum und Anstalt.
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
        <KernSpace size="x-large" />
        <KernText muted size="small">
          Mock-up v2 · Kennzahlensystem = Auswertung · Berichte = PDF-Konfiguration · Web-Erfassung
          = Dateneingabe
        </KernText>
        <KernSpace size="large" />
      </KernContainer>
    </KernAppChrome>
  );
}
