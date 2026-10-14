import React from 'react';
import { MosquePlace } from '../types/mosque';
import { calculateQiblaDirection, formatDistance } from '../utils/qibla';
import {
  X,
  MapPin,
  Navigation,
  Star,
  Phone,
  Globe,
  Compass,
  Footprints,
  Car,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface MosqueDetailsModalProps {
  mosque: MosquePlace | null;
  onClose: () => void;
}

export const MosqueDetailsModal: React.FC<MosqueDetailsModalProps> = ({
  mosque,
  onClose,
}) => {
  if (!mosque) return null;

  const qiblaAngle = calculateQiblaDirection(mosque.location.lat, mosque.location.lng);

  // Approximate travel times
  const walkMinutes = mosque.distanceMeters
    ? Math.max(1, Math.round(mosque.distanceMeters / 75))
    : null;
  const driveMinutes = mosque.distanceMeters
    ? Math.max(1, Math.round(mosque.distanceMeters / 500))
    : null;

  const handleOpenGoogleMaps = () => {
    const url =
      mosque.googleMapsURI ||
      `https://www.google.com/maps/dir/?api=1&destination=${mosque.location.lat},${mosque.location.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mosque.name,
        text: `${mosque.name} - ${mosque.address}`,
        url: mosque.googleMapsURI || window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${mosque.name}\n${mosque.address}\nhttps://www.google.com/maps/search/?api=1&query=${mosque.location.lat},${mosque.location.lng}`
      );
      alert("Masjid manzili nusxalandi!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {mosque.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jome Masjidi · Namozgoh
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Photos if available */}
          {mosque.photos && mosque.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
              {mosque.photos.slice(0, 2).map((photoUrl, idx) => (
                <div key={idx} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={mosque.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quick Metrics (Travel times & Distance) */}
          {mosque.distanceMeters !== undefined && (
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-center">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Masofa</span>
                <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                  {formatDistance(mosque.distanceMeters)}
                </p>
              </div>
              <div className="text-center border-x border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                  <Footprints className="w-3 h-3 text-slate-400" /> Piyoda
                </span>
                <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                  ~{walkMinutes} daqiqa
                </p>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                  <Car className="w-3 h-3 text-slate-400" /> Avtomobil
                </span>
                <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                  ~{driveMinutes} daqiqa
                </p>
              </div>
            </div>
          )}

          {/* Location & Details List */}
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-500 font-medium">Aniq Manzil:</span>
                <p className="text-slate-800 font-medium mt-0.5">{mosque.address}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-600 font-medium">Qibla azimuti:</span>
              </div>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {qiblaAngle}° Ka'ba tomon
              </span>
            </div>

            {mosque.rating && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-xs text-slate-600 font-medium">Reyting va sharhlar:</span>
                </div>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {mosque.rating.toFixed(1)} / 5.0 ({mosque.userRatingCount || 0} ta sharh)
                </span>
              </div>
            )}

            {mosque.phoneNumber && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-600 font-medium">Telefon raqam:</span>
                </div>
                <a
                  href={`tel:${mosque.phoneNumber}`}
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  {mosque.phoneNumber}
                </a>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Google Xaritada Marshrut Olish</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              title="Ulashish"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
