import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  WEBERFASSUNG_CATEGORIES,
  getWeberfassungCategoryForForm,
  getWeberfassungFormLabel,
  isWeberfassungFormView,
  type WeberfassungCategoryKey,
  type WeberfassungFormKey,
  type WeberfassungView,
} from '../data/weberfassungNav';
import { getJvaById } from '../data/jvas';
import { JustizSidebar } from '../ui/JustizSidebar';
import {
  KernAlert,
  KernBadge,
  KernButton,
  KernCard,
  KernColumn,
  KernHeading,
  KernLink,
  KernRow,
  KernSpace,
  KernText,
} from '../ui/kern';

interface WeberfassungAppProps {
  onBackToLanding: () => void;
  onLogout: () => void;
}

const CURRENT_PERIOD_LABEL = '2026 · Quartal 1';

const DEFAULT_EXPANDED: Record<WeberfassungCategoryKey, boolean> = {
  strukturdaten: true,
  haushalt: false,
};

export function WeberfassungApp({ onBackToLanding, onLogout }: WeberfassungAppProps) {
  const { user } = useAuth();
  const [view, setView] = useState<WeberfassungView>('overview');
  const [expandedCategories, setExpandedCategories] = useState(DEFAULT_EXPANDED);

  if (!user) return null;

  const jva = user.jvaId ? getJvaById(user.jvaId) : null;
  const isJvaRole = user.role === 'jva';
  const activeCategory = isWeberfassungFormView(view) ? getWeberfassungCategoryForForm(view) : null;
  const openFormCount = WEBERFASSUNG_CATEGORIES.reduce(
    (count, category) => count + category.items.length,
    0,
  );

  const selectForm = (formKey: WeberfassungFormKey) => {
    const categoryKey = getWeberfassungCategoryForForm(formKey);
    setExpandedCategories((prev) => ({ ...prev, [categoryKey]: true }));
    setView(formKey);
  };

  const toggleCategory = (categoryKey: WeberfassungCategoryKey) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryKey]: !prev[categoryKey] }));
  };

  return (
    <div className="flex min-h-screen">
      <JustizSidebar
        title="Web-Erfassung"
        userName={user.displayName}
        onBackToLanding={onBackToLanding}
        onLogout={onLogout}
        note={
          <KernText size="small">
            Web-Erfassung = Eingabe.
            <br />
            Auswertung im Kennzahlensystem.
          </KernText>
        }
      >
        <KernButton
          type="button"
          variant={view === 'overview' ? 'primary' : 'tertiary'}
          icon="checklist"
          label="Übersicht"
          block
          onClick={() => setView('overview')}
        />

        {WEBERFASSUNG_CATEGORIES.map((category) => {
          const sectionActive = activeCategory === category.key;
          const expanded = expandedCategories[category.key];

          return (
            <div key={category.key}>
              <div className="flex items-stretch gap-1">
                <div className="min-w-0 flex-1">
                  <KernButton
                    type="button"
                    variant={sectionActive ? 'primary' : 'tertiary'}
                    label={category.label}
                    block
                    onClick={() => toggleCategory(category.key)}
                  />
                </div>
                <KernButton
                  type="button"
                  variant="tertiary"
                  icon="arrow-down"
                  label=""
                  alt={`Untermenü ${category.label}`}
                  aria-expanded={expanded}
                  className="justiz-sidebar__icon-btn"
                  onClick={() => toggleCategory(category.key)}
                />
              </div>
              {expanded ? (
                <div className="mt-1 flex flex-col gap-1">
                  {category.items.map((item) => (
                    <KernButton
                      key={item.key}
                      type="button"
                      variant={view === item.key ? 'primary' : 'tertiary'}
                      label={item.label}
                      block
                      className="justiz-sidebar__sub"
                      onClick={() => selectForm(item.key)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </JustizSidebar>

      <main className="flex-1 overflow-auto bg-(--color-main-bg)">
        <div className="mx-auto max-w-[1200px] p-6">
          {view === 'overview' ? (
            <WeberfassungOverview
              isJvaRole={isJvaRole}
              jvaName={jva?.name}
              openFormCount={openFormCount}
              onSelectForm={selectForm}
            />
          ) : (
            <WeberfassungFormPlaceholder formKey={view} onBack={() => setView('overview')} />
          )}
        </div>
      </main>
    </div>
  );
}

function WeberfassungOverview({
  isJvaRole,
  jvaName,
  openFormCount,
  onSelectForm,
}: {
  isJvaRole: boolean;
  jvaName?: string;
  openFormCount: number;
  onSelectForm: (formKey: WeberfassungFormKey) => void;
}) {
  return (
    <>
      <KernHeading level={1}>Meldungen erfassen</KernHeading>
      <KernText>
        {isJvaRole && jvaName
          ? `Erfassen und übermitteln Sie die Kennzahlen für ${jvaName}.`
          : 'Unterstützen Sie die JVA-Meldungen und prüfen Sie den Bearbeitungsstand der Formulare.'}
      </KernText>
      {isJvaRole ? (
        <>
          <KernSpace size="small" />
          <KernBadge label="Ihre Anstalt" variant="info" />
        </>
      ) : null}
      <KernSpace size="default" />
      <KernAlert title="Aktueller Berichtszeitraum" variant="info">
        Die Formulare beziehen sich auf {CURRENT_PERIOD_LABEL}. Die fachlichen Felder der Meldebögen
        werden schrittweise ergänzt.
      </KernAlert>
      <KernSpace size="large" />
      <KernRow>
        <KernColumn sizes={{ xs: 12, md: 4 }}>
          <KernCard title="Berichtszeitraum" subline="Aktuell">
            {CURRENT_PERIOD_LABEL}
          </KernCard>
        </KernColumn>
        <KernColumn sizes={{ xs: 12, md: 4 }}>
          <KernCard title="Offene Formulare" subline="Noch nicht übermittelt">
            {openFormCount} Bereiche
          </KernCard>
        </KernColumn>
        <KernColumn sizes={{ xs: 12, md: 4 }}>
          <KernCard title="Letzte Übermittlung" subline="Status">
            Noch keine Übermittlung
          </KernCard>
        </KernColumn>
      </KernRow>
      <KernSpace size="large" />
      <KernHeading level={2}>Formulare</KernHeading>
      <KernText muted>
        Die Navigation bleibt in der Seitenleiste. Hier sehen Sie die offenen Meldebögen nach
        Strukturdaten und Haushalt.
      </KernText>
      <KernSpace size="default" />
      <KernRow>
        {WEBERFASSUNG_CATEGORIES.map((category) => (
          <KernColumn key={category.key} sizes={{ xs: 12, md: 6 }}>
            <KernCard title={category.label} subline="Offen">
              <ul className="w-full space-y-1 text-left">
                {category.items.map((item) => (
                  <li key={item.key} className="text-left">
                    <KernLink
                      href="#formular"
                      label={item.label}
                      className="inline-block max-w-full text-left"
                      onClick={(event) => {
                        event.preventDefault();
                        onSelectForm(item.key);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </KernCard>
          </KernColumn>
        ))}
      </KernRow>
    </>
  );
}

function WeberfassungFormPlaceholder({
  formKey,
  onBack,
}: {
  formKey: WeberfassungFormKey;
  onBack: () => void;
}) {
  const categoryKey = getWeberfassungCategoryForForm(formKey);
  const category = WEBERFASSUNG_CATEGORIES.find((entry) => entry.key === categoryKey);
  const formLabel = getWeberfassungFormLabel(formKey);

  return (
    <>
      <KernHeading level={1}>{formLabel}</KernHeading>
      <KernText muted>{category?.label ?? 'Web-Erfassung'}</KernText>
      <KernSpace size="default" />
      <KernAlert title="Formular in Vorbereitung" variant="info">
        Dieses Erfassungsformular wird für die Meldungen der Justizvollzugsanstalten aufgebaut. Die
        Felder orientieren sich an den jeweiligen Meldebögen.
      </KernAlert>
      <KernSpace size="large" />
      <KernCard
        title="Nächster Schritt"
        subline="Fachliche Erfassung"
        footer={<KernButton type="button" variant="secondary" label="Zurück zur Übersicht" onClick={onBack} />}
      >
        Sobald die Meldebögen hinterlegt sind, können hier Werte erfasst, geprüft und übermittelt
        werden. Bis dahin bleibt diese Seite eine Platzhalteransicht ohne Speicherung.
      </KernCard>
    </>
  );
}
