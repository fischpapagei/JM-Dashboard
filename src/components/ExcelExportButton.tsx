import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface ExcelExportButtonProps {
  onExport: () => void | Promise<void>;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function ExcelExportButton({ onExport, disabled = false, onError }: ExcelExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onExport();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Excel-Export konnte nicht erzeugt werden.';
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
        className="inline-flex items-center gap-2 rounded-lg border border-[#2d5a8e]/30 bg-white px-4 py-2 text-sm font-medium text-[#1a3352] shadow-sm transition-colors hover:border-[#2d5a8e]/50 hover:bg-[#2d5a8e]/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
        {loading ? 'Excel wird erzeugt …' : 'Excel-Export'}
      </button>
      {error && (
        <p className="max-w-sm text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
