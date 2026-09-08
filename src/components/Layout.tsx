import type { ReactNode } from "react";
import { Badge } from "./Badge";

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
      {showDemo && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Demo-Daten aktiv — keine echten BASIS-Werte
        </div>
      )}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
            {showDemo && <Badge variant="demo">Demo-Daten</Badge>}
          </div>
          {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="space-y-6">{children}</div>
      <p className="mt-8 text-right text-xs text-slate-400">
        Mock-up v2 · Dashboard nur Auswertung, keine BASIS-Eingabe
      </p>
    </div>
  );
}
