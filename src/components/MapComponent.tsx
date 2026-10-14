import React, { useEffect } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MosquePlace, UserLocation } from '../types/mosque';
import { formatDistance } from '../utils/qibla';
import { Navigation, MapPin, Star, Moon } from 'lucide-react';

interface MapComponentProps {
  userLocation: UserLocation | null;
  mosques: MosquePlace[];
  selectedMosque: MosquePlace | null;
  onSelectMosque: (mosque: MosquePlace | null) => void;
  onOpenDetails: (mosque: MosquePlace) => void;
  center: { lat: number; lng: number };
  zoom: number;
}

// Controller component to handle smooth panning and camera transitions
const CameraController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  selectedMosque: MosquePlace | null;
}> = ({ center, zoom, selectedMosque }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedMosque) {
      map.panTo(selectedMosque.location);
      map.setZoom(16);
    } else {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom, selectedMosque]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  mosques,
  selectedMosque,
  onSelectMosque,
  onOpenDetails,
  center,
  zoom,
}) => {
  return (
    <div className="w-full h-full relative">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={true}
        streetViewControl={false}
        fullscreenControl={true}
        style={{ width: '100%', height: '100%' }}
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        onClick={() => onSelectMosque(null)}
      >
        <CameraController
          center={center}
          zoom={zoom}
          selectedMosque={selectedMosque}
        />

        {/* User GPS location marker */}
        {userLocation && (
          <AdvancedMarker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title="Sizning GPS joylashuvingiz"
          >
            <div className="relative flex items-center justify-center">
              {/* Radar pulse */}
              <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
              {/* Outer boundary */}
              <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px]">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Mosque markers */}
        {mosques.map((mosque) => {
          const isSelected = selectedMosque?.id === mosque.id;
          return (
            <AdvancedMarker
              key={mosque.id}
              position={mosque.location}
              title={mosque.name}
              onClick={() => onSelectMosque(mosque)}
            >
              <div
                className={`relative flex items-center justify-center transition-transform ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                }`}
              >
                <div
                  className={`px-2 py-1.5 rounded-full shadow-md border-2 flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-emerald-700 border-white text-white shadow-emerald-900/30'
                      : 'bg-emerald-600 border-white text-white hover:bg-emerald-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 fill-white text-white" />
                  {mosque.distanceMeters !== undefined && (
                    <span className="text-[10px] font-bold tabular-nums">
                      {formatDistance(mosque.distanceMeters)}
                    </span>
                  )}
                </div>
              </div>
            </AdvancedMarker>
          );
        })}

        {/* InfoWindow for selected mosque */}
        {selectedMosque && (
          <InfoWindow
            position={selectedMosque.location}
            onCloseClick={() => onSelectMosque(null)}
            pixelOffset={[0, -32]}
          >
            <div className="p-1 max-w-xs text-slate-900">
              <h4 className="font-bold text-sm leading-tight text-slate-900">
                {selectedMosque.name}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {selectedMosque.address}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                {selectedMosque.distanceMeters !== undefined && (
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {formatDistance(selectedMosque.distanceMeters)}
                  </span>
                )}
                {selectedMosque.rating && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {selectedMosque.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const url =
                      selectedMosque.googleMapsURI ||
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.location.lat},${selectedMosque.location.lng}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex-1 py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Yo'nalish</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetails(selectedMosque)}
                  className="py-1 px-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batafsil
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};
