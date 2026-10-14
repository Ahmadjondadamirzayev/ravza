import React from 'react';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const UpdateNotificationBar: React.FC = () => {
  const { needRefresh, reloadApp, dismissUpdate } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div className="bg-emerald-800 text-white px-4 py-2.5 text-xs sm:text-sm sticky top-0 z-50 shadow-md border-b border-emerald-600 flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-white/20 text-emerald-100 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="font-medium">
          Ilovaning yangi versiyasi tayyor!
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={reloadApp}
          className="px-3 py-1 rounded-md bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-emerald-800" />
          <span>Yangilash</span>
        </button>
        <button
          type="button"
          onClick={dismissUpdate}
          className="p-1 rounded text-emerald-200 hover:text-white transition-colors cursor-pointer"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
