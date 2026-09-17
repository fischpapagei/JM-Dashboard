import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface ReportScrollTableProps {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}

function updateStickyOffsets(root: HTMLElement): void {
  const table = root.querySelector('table');
  if (!table) return;

  const firstBody = table.tBodies[0]?.rows[0];
  const col1 =
    firstBody?.querySelector<HTMLElement>('.report-sticky-1') ??
    table.querySelector<HTMLElement>('th.report-sticky-1');

  root.style.setProperty('--report-sticky-left-1', '0px');
  root.style.setProperty('--report-sticky-left-2', `${col1?.offsetWidth ?? 0}px`);
}

export function ReportScrollTable({
  children,
  className = '',
  scroll = true,
}: ReportScrollTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const update = () => updateStickyOffsets(root);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(root);
    const table = root.querySelector('table');
    if (table) observer.observe(table);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        scroll ? `report-scroll-table w-full overflow-x-auto ${className}`.trim() : className
      }
    >
      {children}
    </div>
  );
}
