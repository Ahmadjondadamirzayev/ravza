import React, { useState, useEffect } from 'react';
import { calculateQiblaDirection, calculateDistanceToKaabaKm } from '../utils/qibla';
import { X, Compass, Navigation2, MapPin, AlertCircle } from 'lucide-react';

interface QiblaModalProps {
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({ userLocation, onClose }) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassPermission, setCompassPermission] = useState<string>('prompt');

  const lat = userLocation?.lat || 41.311081;
  const lng = userLocation?.lng || 69.240562;

  const qiblaAngle = calculateQiblaDirection(lat, lng);
  const distanceKaaba = calculateDistanceToKaabaKm(lat, lng);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is supported on iOS Safari
      let heading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (heading === undefined && e.alpha !== null) {
        // Android standard: 360 - alpha
        heading = (360 - e.alpha) % 360;
      }
      if (heading !== undefined && heading !== null) {
        setDeviceHeading(Math.round(heading));
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const requestOrientationPermission = async () => {
    const devOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof devOrientation.requestPermission === 'function') {
      try {
        const response = await devOrientation.requestPermission();
        setCompassPermission(response);
      } catch (err) {
        console.warn('Orientation permission denied:', err);
      }
    }
  };

  // Rotation for the compass dial
  // If device heading is available, dial rotates against heading, pointer stays at qibla
  const dialRotation = deviceHeading !== null ? -deviceHeading : 0;
  const kaabaPointerRotation = qiblaAngle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-base font-bold leading-tight">Qibla Kompasi</h2>
              <p className="text-xs text-emerald-100">Makka / Muqaddas Ka'ba yo'nalishi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compass Visual */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-50">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-200 bg-white shadow-inner flex items-center justify-center">
            {/* Outer ring markers */}
            <div
              className="absolute inset-0 rounded-full transition-transform duration-300"
              style={{ transform: `rotate(${dialRotation}deg)` }}
            >
              {/* Cardinal directions */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-xs text-rose-600">
                N (Shimol)
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-bold text-xs text-slate-500">
                S (Janub)
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                E (Sharq)
              </span>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                W (G'arb)
              </span>

              {/* Tick marks */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className={`w-0.5 ${i % 3 === 0 ? 'h-3 bg-slate-400' : 'h-1.5 bg-slate-200'}`} />
                </div>
              ))}

              {/* Kaaba Direction Indicator On Outer Ring */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                style={{ transform: `rotate(${kaabaPointerRotation}deg)` }}
              >
                <div className="w-3.5 h-3.5 bg-emerald-600 rotate-45 -mt-1.5 border border-white shadow-xs" />
              </div>
            </div>

            {/* Center Pointer needle directed to Qibla */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-300 pointer-events-none"
              style={{ transform: `rotate(${kaabaPointerRotation + dialRotation}deg)` }}
            >
              {/* Emerald needle pointing to Kaaba */}
              <div className="absolute top-10 flex flex-col items-center">
                <Navigation2 className="w-8 h-8 text-emerald-600 fill-emerald-600 filter drop-shadow-sm" />
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded mt-1">
                  KA'BA
                </span>
              </div>
              {/* Opposite grey tail */}
              <div className="absolute bottom-10 w-1.5 h-10 bg-slate-300 rounded-full" />
            </div>

            {/* Center Pivot */}
            <div className="absolute w-6 h-6 rounded-full bg-emerald-700 border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Device orientation prompt if available */}
          {typeof window !== 'undefined' &&
            'DeviceOrientationEvent' in window &&
            deviceHeading === null && (
              <button
                type="button"
                onClick={requestOrientationPermission}
                className="mt-3 text-xs text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer"
              >
                Kompani harakatlantirish uchun datchikni faollashtirish
              </button>
            )}

          {deviceHeading !== null && (
            <p className="text-xs text-slate-500 mt-2">
              Qurilma yo'nalishi: <span className="font-semibold text-slate-700">{deviceHeading}°</span>
            </p>
          )}
        </div>

        {/* Numerical details */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Qibla burchagi (Azimut):</span>
            <span className="font-bold text-emerald-700 tabular-nums text-base">
              {qiblaAngle}°
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Makka / Ka'bagacha masofa:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {distanceKaaba.toLocaleString()} km
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Koordinata: {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
