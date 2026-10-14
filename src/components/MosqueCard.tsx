import React from 'react';
import { MosquePlace } from '../types/mosque';
import { formatDistance } from '../utils/qibla';
import { MapPin, Navigation, Star, Phone, CheckCircle, Info } from 'lucide-react';

interface MosqueCardProps {
  mosque: MosquePlace;
  isSelected?: boolean;
  onSelect: (mosque: MosquePlace) => void;
  onOpenDetails: (mosque: MosquePlace) => void;
}

export const MosqueCard: React.FC<MosqueCardProps> = ({
  mosque,
  isSelected,
  onSelect,
  onOpenDetails,
}) => {
  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      mosque.googleMapsURI ||
      `https://www.google.com/maps/dir/?api=1&destination=${mosque.location.lat},${mosque.location.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onSelect(mosque)}
      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-400/40'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Title & Distance */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1">
          {mosque.name}
        </h3>
        {mosque.distanceMeters !== undefined && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 tabular-nums shrink-0">
            {formatDistance(mosque.distanceMeters)}
          </span>
        )}
      </div>

      {/* Address */}
      <p className="text-xs text-slate-600 line-clamp-1 mt-1 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{mosque.address}</span>
      </p>

      {/* Metadata: Unboxed with separators */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2.5">
        {mosque.rating ? (
          <>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="tabular-nums">{mosque.rating.toFixed(1)}</span>
            </span>
            {mosque.userRatingCount && (
              <span className="tabular-nums">({mosque.userRatingCount})</span>
            )}
            <span aria-hidden="true" className="text-slate-300">·</span>
          </>
        ) : null}

        {mosque.isOpenNow !== undefined && (
          <>
            <span className={mosque.isOpenNow ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
              {mosque.isOpenNow ? 'Ochiq' : 'Yopiq'}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
          </>
        )}

        <span className="text-slate-500">Jome Masjidi</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleDirections}
          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Yo'nalish</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(mosque);
          }}
          className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Batafsil</span>
        </button>
      </div>
    </div>
  );
};
