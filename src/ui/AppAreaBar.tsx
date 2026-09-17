import { MAIN_APP_AREAS, type MainAppArea } from '../data/appAreas';

interface AppAreaBarProps {
  active: MainAppArea | null;
  onSelect: (area: MainAppArea) => void;
}

export function AppAreaBar({ active, onSelect }: AppAreaBarProps) {
  return (
    <nav className="app-area-bar" aria-label="Hauptbereiche">
      {MAIN_APP_AREAS.map((area) => {
        const isActive = active === area.id;
        return (
          <button
            key={area.id}
            type="button"
            className={`app-area-bar__item${isActive ? ' app-area-bar__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(area.id)}
          >
            {area.label}
          </button>
        );
      })}
    </nav>
  );
}
