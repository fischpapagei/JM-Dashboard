import { useState } from 'react';
import { KernAlert, KernButton } from '../ui/kern';

interface ExcelExportButtonProps {
  onExport: () => void | Promise<void>;
  disabled?: boolean;
  onError?: (message: string) => void;
  label?: string;
}

export function ExcelExportButton({
  onExport,
  disabled = false,
  onError,
  label = 'Excel-Export',
}: ExcelExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onExport();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Excel-Export konnte nicht erzeugt werden.';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <KernButton
        type="button"
        variant="secondary"
        icon="download"
        label={loading ? 'Excel wird erzeugt …' : label}
        disabled={disabled || loading}
        onClick={handleClick}
      />
      {error ? (
        <KernAlert title="Excel-Export fehlgeschlagen" variant="danger">
          {error}
        </KernAlert>
      ) : null}
    </div>
  );
}
