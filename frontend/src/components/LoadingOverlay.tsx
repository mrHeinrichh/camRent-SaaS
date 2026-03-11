import { useEffect, useState } from 'react';
import { useAppStore } from '@/src/store';

export function LoadingOverlay() {
  const activeRequests = useAppStore((state) => state.activeRequests);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeRequests > 0) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 150);
    return () => clearTimeout(timer);
  }, [activeRequests]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px]">
      <div className="flex w-[90%] max-w-sm flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-lg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--tone-accent)]" />
        <p className="text-sm font-semibold text-slate-900">Processing...</p>
        <p className="text-xs text-slate-500">Please wait while we save your changes.</p>
      </div>
    </div>
  );
}
