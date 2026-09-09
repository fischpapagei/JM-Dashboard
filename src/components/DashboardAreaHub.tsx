import type { DashboardAreaKey } from '../types/domain';
import { areaHasFreiePlaetze, getDashboardArea } from '../data/dashboardAreas';
import { KernButton, KernCard, KernColumn, KernHeading, KernRow, KernSpace, KernText } from '../ui/kern';

interface DashboardAreaHubProps {
  areaKey: DashboardAreaKey;
  onSelectNrw: () => void;
  onSelectFreiePlaetze?: () => void;
  onSelectJva: () => void;
}

export function DashboardAreaHub({
  areaKey,
  onSelectNrw,
  onSelectFreiePlaetze,
  onSelectJva,
}: DashboardAreaHubProps) {
  const area = getDashboardArea(areaKey);
  const showFreiePlaetze = areaHasFreiePlaetze(areaKey);
  const columnSize = showFreiePlaetze ? 4 : 6;

  return (
    <>
      <KernHeading level={2} size="small">
        {area.sidebarLabel}
      </KernHeading>
      <KernText muted>
        Wählen Sie die gewünschte Auswertungsebene für {area.sidebarLabel.toLowerCase()}.
      </KernText>
      <KernSpace size="large" />
      <KernRow>
        <KernColumn sizes={{ xs: 12, md: columnSize }}>
          <KernCard
            title="NRW gesamt"
            subline="Landesdashboard"
            footer={
              <KernButton type="button" variant="primary" label="Zur Auswertung" onClick={onSelectNrw} />
            }
          >
            Landesweites Dashboard mit Kennzahlen, Verläufen und Übersichten für alle JVAen.
          </KernCard>
        </KernColumn>

        {showFreiePlaetze && onSelectFreiePlaetze ? (
          <KernColumn sizes={{ xs: 12, md: columnSize }}>
            <KernCard
              title="Landesweit freie Plätze"
              subline="Kapazität"
              footer={
                <KernButton
                  type="button"
                  variant="primary"
                  label="Zu den freien Plätzen"
                  onClick={onSelectFreiePlaetze}
                />
              }
            >
              Tagesaktuelle freie Plätze landesweit nach Kursart und JVA.
            </KernCard>
          </KernColumn>
        ) : null}

        <KernColumn sizes={{ xs: 12, md: columnSize }}>
          <KernCard
            title="JVA-Stammdatenblatt"
            subline="Anstalt"
            footer={
              <KernButton type="button" variant="primary" label="Zum Stammdatenblatt" onClick={onSelectJva} />
            }
          >
            Anstaltsbezogene Kennzahlen und Detailauswertungen je JVA mit NRW-Vergleich.
          </KernCard>
        </KernColumn>
      </KernRow>
    </>
  );
}
