import type { ReactNode } from 'react';
import type { MainAppArea } from '../data/appAreas';
import { AppAreaBar } from './AppAreaBar';

interface AppShellLayoutProps {
  active: MainAppArea | null;
  onSelectArea: (area: MainAppArea) => void;
  children: ReactNode;
}

export function AppShellLayout({ active, onSelectArea, children }: AppShellLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppAreaBar active={active} onSelect={onSelectArea} />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
