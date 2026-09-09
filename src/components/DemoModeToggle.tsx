import { KernButton } from '../ui/kern';

interface DemoModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function DemoModeToggle({ enabled, onChange }: DemoModeToggleProps) {
  return (
    <KernButton
      type="button"
      variant={enabled ? 'primary' : 'secondary'}
      label={enabled ? 'Demo-Daten AN' : 'Demo-Daten AUS'}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    />
  );
}
