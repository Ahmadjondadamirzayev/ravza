import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MosquePlace, UserLocation, PrayerTimes } from './types/mosque';
import { searchNearbyMosques, searchMosquesByText } from './services/mosqueSearch';
import { getLivePrayerTimes, calculatePrayerTimes } from './utils/prayerTimes';
import { formatDistance } from './utils/qibla';
import { Header } from './components/Header';
import { PrayerTimesBar } from './components/PrayerTimesBar';
import { MosqueCard } from './components/MosqueCard';
import { MosqueDetailsModal } from './components/MosqueDetailsModal';
import { QiblaModal } from './components/QiblaModal';
import { MapComponent } from './components/MapComponent';
import { UpdateNotificationBar } from './components/UpdateNotificationBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Search,
  MapPin,
  Compass,
  RefreshCw,
  Locate,
  AlertCircle,
  Map as MapIcon,
  ListFilter,
  Navigation,
  Info,
  X,
  Star,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC2Ne3m-hcgPbw54t8rCY0EU7ej5X8BZok';

// Default center: Tashkent, Uzbekistan
const DEFAULT_CENTER = {
  lat: 41.311081,
  lng: 69.240562,
};

const POPULAR_CITIES = [
  { name: 'Toshkent', lat: 41.311081, lng: 69.240562 },
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597 },
  { name: 'Buxoro', lat: 39.7747, lng: 64.4286 },
  { name: 'Namangan', lat: 40.9983, lng: 71.6726 },
  { name: 'Andijon', lat: 40.7821, lng: 72.3442 },
  { name: 'Farg\'ona', lat: 40.3842, lng: 71.7843 },
];

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [activeCenter, setActiveCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(14);

  const [mosques, setMosques] = useState<MosquePlace[]>([]);
  const [selectedMosque, setSelectedMosque] = useState<MosquePlace | null>(null);
  const [detailMosque, setDetailMosque] = useState<MosquePlace | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRadius, setSelectedRadius] = useState<number>(5000); // 5km
  const [activeFilter, setActiveFilter] = useState<'all' | 'near' | 'open' | 'top'>('all');

  const [isQiblaOpen, setIsQiblaOpen] = useState<boolean>(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  const lastCalculatedDateRef = useRef<number>(new Date().getDate());

  // Quota event listener
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Fetch or calculate prayer times for current coordinates
  const refreshPrayerTimes = useCallback(async (coords: { lat: number; lng: number }) => {
    try {
      // 1. Instant local calculation so UI never waits
      const instant = calculatePrayerTimes(coords.lat, coords.lng, new Date());
      setPrayerTimes(instant);
      lastCalculatedDateRef.current = new Date().getDate();

      // 2. Verified online sync
      const verified = await getLivePrayerTimes(coords.lat, coords.lng, new Date());
      setPrayerTimes(verified);
    } catch (e) {
      console.warn('Prayer times calculation error:', e);
    }
  }, []);

  // Update prayer times on center coordinate changes
  useEffect(() => {
    refreshPrayerTimes(activeCenter);
  }, [activeCenter, refreshPrayerTimes]);

  // Real-time ticker: updates remaining minutes and triggers daily recalculation
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date().getDate();
      // If midnight passed (new day), perform a complete daily recalculation!
      if (currentDate !== lastCalculatedDateRef.current) {
        lastCalculatedDateRef.current = currentDate;
        refreshPrayerTimes(activeCenter);
      } else {
        // Otherwise re-calculate countdown and next prayer highlight
        setPrayerTimes((prev) => {
          if (!prev) return null;
          const fresh = calculatePrayerTimes(activeCenter.lat, activeCenter.lng, new Date());
          return {
            ...prev,
            nextPrayerName: fresh.nextPrayerName,
            minutesToNextPrayer: fresh.minutesToNextPrayer,
            dateStr: fresh.dateStr,
          };
        });
      }
    }, 30000); // check every 30 seconds

    // When phone wakes up or user returns to tab, refresh immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPrayerTimes(activeCenter);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeCenter, refreshPrayerTimes]);

  // Load mosques near center
  const loadMosques = useCallback(
    async (coords: { lat: number; lng: number }, radius: number) => {
      setIsLoading(true);
      try {
        const results = await searchNearbyMosques(coords, radius);
        setMosques(results);
      } catch (err) {
        console.error('Error fetching mosques:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // GPS Location Trigger
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Brauzeringiz GPS geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(coords);
        setActiveCenter({ lat: coords.lat, lng: coords.lng });
        setMapZoom(15);
        setIsLocating(false);
        loadMosques({ lat: coords.lat, lng: coords.lng }, selectedRadius);
      },
      (error) => {
        setIsLocating(false);
        let msg = "GPS orqali joylashuvni aniqlab bo'lmadi.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "GPS ruxsati berilmadi. Iltimos, brauzerda geolokatsiyaga ruxsat bering yoki qidiruvdan foydalaning.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS signali aniqlanmadi.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS so'rov vaqti tugadi.";
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  }, [selectedRadius, loadMosques]);

  // Initial load: Attempt GPS geolocation once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setUserLocation(coords);
          setActiveCenter({ lat: coords.lat, lng: coords.lng });
          loadMosques({ lat: coords.lat, lng: coords.lng }, 5000);
        },
        () => {
          loadMosques(DEFAULT_CENTER, 5000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      loadMosques(DEFAULT_CENTER, 5000);
    }
  }, [loadMosques]);

  // Handle manual search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadMosques(activeCenter, selectedRadius);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchMosquesByText(searchQuery, activeCenter);
      if (results.length > 0) {
        setMosques(results);
        setActiveCenter(results[0].location);
        setMapZoom(14);
      } else {
        loadMosques(activeCenter, selectedRadius);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Change city shortcut
  const handleCitySelect = (city: typeof POPULAR_CITIES[0]) => {
    const coords = { lat: city.lat, lng: city.lng };
    setActiveCenter(coords);
    setMapZoom(14);
    setSelectedMosque(null);
    loadMosques(coords, selectedRadius);
  };

  // Change radius
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    loadMosques(activeCenter, radius);
  };

  // Filter mosques
  const filteredMosques = useMemo(() => {
    return mosques.filter((m) => {
      if (activeFilter === 'near') {
        return (m.distanceMeters || 0) <= 2000;
      }
      if (activeFilter === 'open') {
        return m.isOpenNow !== false;
      }
      if (activeFilter === 'top') {
        return (m.rating || 0) >= 4.5;
      }
      return true;
    });
  }, [mosques, activeFilter]);

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['maps', 'places', 'marker', 'geometry', 'core']}
    >
      <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
        {/* PWA Update Banner */}
        <UpdateNotificationBar />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Tier 2 Quota Exceeded Warning Banner */}
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Top Header */}
        <Header
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          onOpenQibla={() => setIsQiblaOpen(true)}
          onOpenPrayerTimes={() => {}}
          mosqueCount={filteredMosques.length}
        />

        {/* Prayer Times Bar */}
        <PrayerTimesBar
          prayerTimes={prayerTimes}
          cityName={userLocation ? 'GPS Joylashuvingiz' : 'Toshkent'}
          onOpenQibla={() => setIsQiblaOpen(true)}
        />

        {/* Location alert if GPS permission was denied */}
        {locationError && (
          <div className="bg-amber-50/95 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="line-clamp-2">{locationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="font-medium text-amber-800 underline hover:no-underline shrink-0 p-1"
            >
              Yopish
            </button>
          </div>
        )}

        {/* Main Work Area: Responsive Split Screen */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Panel: Search, Filters & Mosque List */}
          <div
            className={`w-full md:w-[400px] lg:w-[460px] flex flex-col bg-white border-r border-slate-200 h-full z-20 transition-all ${
              mobileTab === 'map' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search and radius control */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masjid nomi yoki manzil bo'yicha qidiring..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      loadMosques(activeCenter, selectedRadius);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
                  >
                    Tozalash
                  </button>
                )}
              </form>

              {/* City quick picks */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                  Shaharlar:
                </span>
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 active:bg-slate-200 whitespace-nowrap shrink-0 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {city.name}
                  </button>
                ))}
              </div>

              {/* Radius selection */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-xs text-slate-500 font-medium">Qidiruv radiusi:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg">
                  {[1000, 3000, 5000, 10000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRadiusChange(r)}
                      className={`min-h-[28px] px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                        selectedRadius === r
                          ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r / 1000} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar text-xs">
                {[
                  { id: 'all', label: 'Barchasi' },
                  { id: 'near', label: 'Yaqin (<2 km)' },
                  { id: 'open', label: 'Ochiq' },
                  { id: 'top', label: 'Mashhurlar' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                    className={`min-h-[32px] px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-medium transition-colors cursor-pointer ${
                      activeFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In-App Install Banner in list */}
            <div className="px-3 sm:px-4 pt-2 shrink-0">
              <PWAInstallButton variant="banner" />
            </div>

            {/* List Header */}
            <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2 shrink-0">
              <span className="font-semibold text-slate-700">
                Topilgan masjidlar ({filteredMosques.length})
              </span>
              <button
                type="button"
                onClick={() => loadMosques(activeCenter, selectedRadius)}
                disabled={isLoading}
                className="min-h-[32px] flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer p-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Yangilash</span>
              </button>
            </div>

            {/* Mosque Cards List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 pb-20 md:pb-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <p className="text-xs font-medium">Masjidlar qidirilmoqda...</p>
                </div>
              ) : filteredMosques.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-700">
                    Masjidlar topilmadi
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tanlangan radius ({selectedRadius / 1000} km) ichida masjid
                    topilmadi. Radiusni kengaytirib ko'ring yoki boshqa manzilni qidiring.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRadiusChange(10000)}
                    className="mt-3 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    10 km radiusda qidirish
                  </button>
                </div>
              ) : (
                filteredMosques.map((mosque) => (
                  <MosqueCard
                    key={mosque.id}
                    mosque={mosque}
                    isSelected={selectedMosque?.id === mosque.id}
                    onSelect={(m) => {
                      setSelectedMosque(m);
                      if (window.innerWidth < 768) {
                        setMobileTab('map');
                      }
                    }}
                    onOpenDetails={(m) => setDetailMosque(m)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Google Map Canvas */}
          <div
            className={`flex-1 h-full relative ${
              mobileTab === 'list' ? 'hidden md:block' : 'block'
            }`}
          >
            <MapComponent
              userLocation={userLocation}
              mosques={filteredMosques}
              selectedMosque={selectedMosque}
              onSelectMosque={(m) => setSelectedMosque(m)}
              onOpenDetails={(m) => setDetailMosque(m)}
              center={activeCenter}
              zoom={mapZoom}
            />

            {/* Floating Action Buttons on Map */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                title="GPS joylashuvimga qaytish"
                className="w-12 h-12 rounded-full bg-white text-slate-700 active:text-emerald-700 shadow-lg border border-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer touch-manipulation"
              >
                <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsQiblaOpen(true)}
                title="Qibla yo'nalishini ko'rish"
                className="w-12 h-12 rounded-full bg-emerald-600 text-white active:bg-emerald-700 shadow-lg flex items-center justify-center transition-transform active:scale-95 cursor-pointer touch-manipulation"
              >
                <Compass className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Bottom Selected Mosque Card */}
            {selectedMosque && (
              <div className="md:hidden absolute bottom-2 left-2 right-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 animate-slideUp">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 pr-1">
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {selectedMosque.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {selectedMosque.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      {selectedMosque.distanceMeters !== undefined && (
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {formatDistance(selectedMosque.distanceMeters)}
                        </span>
                      )}
                      {selectedMosque.rating && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {selectedMosque.rating.toFixed(1)}
                          </span>
                        </>
                      )}
                      {selectedMosque.isOpenNow !== undefined && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className={selectedMosque.isOpenNow ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                            {selectedMosque.isOpenNow ? 'Ochiq' : 'Yopiq'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMosque(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        selectedMosque.googleMapsURI ||
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.location.lat},${selectedMosque.location.lng}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Yo'nalish olish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailMosque(selectedMosque)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>Batafsil</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-1.5 px-4 z-40 pb-safe shrink-0 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors touch-manipulation ${
              mobileTab === 'list' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span className="text-[11px]">Ro'yxat ({filteredMosques.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors touch-manipulation ${
              mobileTab === 'map' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-[11px]">Xarita</span>
          </button>
          <button
            type="button"
            onClick={() => setIsQiblaOpen(true)}
            className="min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors touch-manipulation"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">Qibla</span>
          </button>
        </div>

        {/* Mosque Details Modal */}
        {detailMosque && (
          <MosqueDetailsModal
            mosque={detailMosque}
            onClose={() => setDetailMosque(null)}
          />
        )}

        {/* Qibla Compass Modal */}
        {isQiblaOpen && (
          <QiblaModal
            userLocation={userLocation || activeCenter}
            onClose={() => setIsQiblaOpen(false)}
          />
        )}
      </div>
    </APIProvider>
  );
}
