import type { ReactNode } from 'react';
import { KernButton, KernHeading, KernText } from './kern';

interface JustizSidebarProps {
  title: string;
  userName: string;
  onBackToLanding: () => void;
  onLogout: () => void;
  children: ReactNode;
  note?: ReactNode;
}

export function JustizSidebar({
  title,
  userName,
  onBackToLanding,
  onLogout,
  children,
  note,
}: JustizSidebarProps) {
  return (
    <aside className="justiz-sidebar flex w-72 shrink-0 flex-col overflow-y-auto p-4">
      <div className="mb-2">
        <KernText type="preline">Justiz NRW</KernText>
        <KernHeading level={2} size="small">
          {title}
        </KernHeading>
        <KernText type="subline">Bildung & Beschäftigung</KernText>
      </div>
      <KernButton
        type="button"
        variant="tertiary"
        icon="arrow-back"
        label="Zur Startseite"
        block
        onClick={onBackToLanding}
      />
      <nav className="justiz-sidebar__nav mt-4 flex flex-col gap-1" aria-label={title}>
        {children}
      </nav>
      <div className="flex-1" />
      {note ? <div className="justiz-sidebar__note mb-4">{note}</div> : null}
      <div className="justiz-sidebar__footer mt-4 border-t border-white/20 pt-3">
        <KernText size="small">{userName}</KernText>
        <KernButton type="button" variant="tertiary" icon="logout" label="Abmelden" onClick={onLogout} />
      </div>
    </aside>
  );
}
