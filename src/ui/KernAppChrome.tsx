import type { ReactNode } from 'react';
import { KernContainer, KernKopfzeile } from './kern';

interface KernAppChromeProps {
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
}

export function KernAppChrome({
  children,
  actions,
  title = 'Bildung & Beschäftigung',
}: KernAppChromeProps) {
  return (
    <>
      <KernKopfzeile label="Land Nordrhein-Westfalen" fluid />
      <div className="justiz-brand-bar">
        <KernContainer fluid>
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Justiz NRW</p>
              <p className="text-base font-semibold">{title}</p>
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
          </div>
        </KernContainer>
      </div>
      {children}
    </>
  );
}
