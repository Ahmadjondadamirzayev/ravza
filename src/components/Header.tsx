import React from 'react';
import { Compass, Locate, Moon, Navigation } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onLocateMe: () => void;
  isLocating: boolean;
  onOpenQibla: () => void;
  onOpenPrayerTimes: () => void;
  mosqueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLocateMe,
  isLocating,
  onOpenQibla,
  onOpenPrayerTimes,
  mosqueCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
          <Moon className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Atrofdagi Masjidlar
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            GPS Xarita & Qibla
          </span>
        </div>
      </div>

      {/* Zone 2: Clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a
          href="#masjidlar"
          className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>Masjidlar</span>
          {mosqueCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold tabular-nums">
              {mosqueCount}
            </span>
          )}
        </a>
        <button
          type="button"
          onClick={onOpenPrayerTimes}
          className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-slate-600"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span>Namoz vaqtlari</span>
        </button>
        <button
          type="button"
          onClick={onOpenQibla}
          className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-slate-600"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Qibla kompas</span>
        </button>
      </nav>

      {/* Zone 3: Primary action & PWA Install Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* PWA In-App Install Button */}
        <PWAInstallButton variant="header" />

        <button
          type="button"
          onClick={onOpenQibla}
          title="Qibla yo'nalishini ko'rish"
          className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
        </button>

        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLocating ? 'Aniqlanmoqda...' : 'GPS Joylashuvim'}
          </span>
          <span className="sm:hidden">
            {isLocating ? 'GPS...' : 'GPS'}
          </span>
        </button>
      </div>
    </header>
  );
};
