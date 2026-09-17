export interface AppBreadcrumbItem {
  id: string;
  label: string;
  onSelect?: () => void;
}

interface AppBreadcrumbProps {
  items: AppBreadcrumbItem[];
}

export function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className="app-breadcrumb" aria-label="Brotkrumennavigation">
      <ol className="app-breadcrumb__list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          const clickable = !isCurrent && Boolean(item.onSelect);

          return (
            <li key={item.id} className="app-breadcrumb__item">
              {index > 0 ? (
                <span className="app-breadcrumb__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              {clickable ? (
                <button type="button" className="app-breadcrumb__link" onClick={item.onSelect}>
                  {item.label}
                </button>
              ) : (
                <span className="app-breadcrumb__current" aria-current={isCurrent ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
