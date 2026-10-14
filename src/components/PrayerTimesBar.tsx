import React from 'react';
import { Clock, Sunrise, Sun, Sunset, Moon, Calendar } from 'lucide-react';
import { PrayerTimes } from '../types/mosque';

interface PrayerTimesBarProps {
  prayerTimes: PrayerTimes | null;
  cityName?: string;
  onOpenQibla?: () => void;
}

export const PrayerTimesBar: React.FC<PrayerTimesBarProps> = ({
  prayerTimes,
  cityName,
}) => {
  if (!prayerTimes) return null;

  const prayers = [
    { name: 'Bomdod', time: prayerTimes.fajr, icon: Sunrise },
    { name: 'Quyosh', time: prayerTimes.sunrise, icon: Sun },
    { name: 'Peshin', time: prayerTimes.dhuhr, icon: Sun },
    { name: 'Asr', time: prayerTimes.asr, icon: Sun },
    { name: 'Shom', time: prayerTimes.maghrib, icon: Sunset },
    { name: 'Xufton', time: prayerTimes.isha, icon: Moon },
  ];

  return (
    <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Next prayer countdown and Date */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">
              Keyingi:{' '}
              <strong className="text-white font-semibold">
                {prayerTimes.nextPrayerName}
              </strong>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-medium tabular-nums whitespace-nowrap">
              {prayerTimes.minutesToNextPrayer > 60
                ? `${Math.floor(prayerTimes.minutesToNextPrayer / 60)} s ${prayerTimes.minutesToNextPrayer % 60} daq`
                : `${prayerTimes.minutesToNextPrayer} daqiqa qoldi`}
            </span>
          </div>

          {/* Today's Gregorian and City */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate text-right">
            {prayerTimes.dateStr && (
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 text-emerald-500/80" />
                <span>{prayerTimes.dateStr}</span>
                <span className="text-slate-600">·</span>
              </span>
            )}
            {cityName && <span className="truncate">{cityName}</span>}
          </div>
        </div>

        {/* Prayer schedule items: smooth horizontal scroll on small screens */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {prayers.map((p) => {
            const isNext = p.name === prayerTimes.nextPrayerName;
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className={`flex-1 min-w-[54px] sm:min-w-[62px] px-1.5 py-1 rounded-lg text-center transition-all shrink-0 ${
                  isNext
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight flex items-center justify-center gap-1">
                  <Icon className="w-2.5 h-2.5 hidden sm:inline" />
                  <span className={isNext ? 'text-emerald-100 font-semibold' : ''}>
                    {p.name}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold tabular-nums mt-0.5">
                  {p.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
