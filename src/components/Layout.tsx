import type { ReactNode } from 'react';
import { KernAlert, KernBadge, KernHeading, KernSpace, KernText } from '../ui/kern';

interface LayoutProps {
  title: string;
  subtitle?: string;
  demoSlot?: ReactNode;
  headerRight?: ReactNode;
  demoMode?: boolean;
  demoBanner?: boolean;
  children: ReactNode;
}

export function Layout({
  title,
  subtitle,
  demoSlot,
  headerRight,
  demoMode,
  demoBanner,
  children,
}: LayoutProps) {
  const showDemo = demoMode ?? demoBanner;
  const right = demoSlot ?? headerRight;

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      {showDemo ? (
        <>
          <KernAlert title="Demo-Daten aktiv" variant="info">
            Keine echten BASIS-Werte
          </KernAlert>
          <KernSpace size="default" />
        </>
      ) : null}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <KernHeading level={1} size="medium">
            {title}
          </KernHeading>
          {showDemo ? (
            <>
              <KernSpace size="2x-small" />
              <KernBadge label="Demo-Daten" variant="info" />
            </>
          ) : null}
          {subtitle ? <KernText muted>{subtitle}</KernText> : null}
        </div>
        {right}
      </header>
      <div className="space-y-6">{children}</div>
      <KernSpace size="large" />
      <KernText muted size="small">
        Mock-up v2 · Dashboard nur Auswertung, keine BASIS-Eingabe
      </KernText>
    </div>
  );
}
