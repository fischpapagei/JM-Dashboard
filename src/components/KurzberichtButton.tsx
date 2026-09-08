import { FileDown } from 'lucide-react';
import { useState } from 'react';

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
      const message =
        err instanceof Error ? err.message : 'PDF konnte nicht erzeugt werden.';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 rounded-lg border border-(--color-accent)/30 bg-white px-4 py-2 text-sm font-medium text-(--color-ink) shadow-sm transition-colors hover:border-(--color-accent)/50 hover:bg-(--color-accent)/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
        {loading ? 'PDF wird erzeugt …' : label}
      </button>
      {error && (
        <p className="max-w-sm text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
