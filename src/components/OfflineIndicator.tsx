import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-xs px-3.5 py-2 text-xs font-medium shadow-xl border border-slate-700 animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Internet yo'q — Oflayn saqlangan ma'lumotlar ko'rsatilmoqda.</span>
    </div>
  );
};
