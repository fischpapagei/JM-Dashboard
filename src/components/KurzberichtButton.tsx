import { useState } from 'react';
import { KernAlert, KernButton } from '../ui/kern';

interface KurzberichtButtonProps {
  onGenerate: () => void | Promise<void>;
  disabled?: boolean;
  onError?: (message: string) => void;
  label?: string;
}

export function KurzberichtButton({
  onGenerate,
  disabled = false,
  onError,
  label = 'Kurzbericht erzeugen',
}: KurzberichtButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onGenerate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF konnte nicht erzeugt werden.';
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
        label={loading ? 'PDF wird erzeugt …' : label}
        disabled={disabled || loading}
        onClick={handleClick}
      />
      {error ? (
        <KernAlert title="PDF-Erzeugung fehlgeschlagen" variant="danger">
          {error}
        </KernAlert>
      ) : null}
    </div>
  );
}
