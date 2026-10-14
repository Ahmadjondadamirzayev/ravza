/// <reference types="@types/google.maps" />
/**
 * Mosque search service combining Google Maps Places API (New)
 * with graceful OpenStreetMap Overpass fallback and offline LocalStorage persistence.
 */
import { MosquePlace } from '../types/mosque';
import { calculateDistanceMeters } from '../utils/qibla';

const CACHE_KEY = 'mosque_cache_last';

export async function searchNearbyMosques(
  center: { lat: number; lng: number },
  radiusMeters: number = 5000
): Promise<MosquePlace[]> {
  const mosques: MosquePlace[] = [];
  const placeIds = new Set<string>();

  // 1. Attempt Google Maps Places API (New) if google object is available
  if (typeof window !== 'undefined' && 'google' in window && window.google?.maps) {
    try {
      const placesLib = (await window.google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      if (placesLib.Place && typeof placesLib.Place.searchNearby === 'function') {
        const request: google.maps.places.SearchNearbyRequest = {
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'regularOpeningHours',
            'nationalPhoneNumber',
            'websiteURI',
            'googleMapsURI',
            'photos',
          ],
          locationRestriction: {
            center,
            radius: Math.min(radiusMeters, 50000),
          },
          includedPrimaryTypes: ['mosque'],
          maxResultCount: 20,
        };

        const { places } = await placesLib.Place.searchNearby(request);

        if (places && places.length > 0) {
          for (const p of places) {
            const loc = p.location;
            if (!loc) continue;

            const lat = typeof loc.lat === 'function' ? loc.lat() : (loc as unknown as { lat: number }).lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : (loc as unknown as { lng: number }).lng;

            const distance = calculateDistanceMeters(center.lat, center.lng, lat, lng);

            let photoUrls: string[] = [];
            if (p.photos && p.photos.length > 0) {
              photoUrls = p.photos.slice(0, 3).map((photo: google.maps.places.Photo) => {
                try {
                  return photo.getURI({ maxWidth: 600, maxHeight: 400 });
                } catch {
                  return '';
                }
              }).filter(Boolean);
            }

            const openingHours = p.regularOpeningHours as unknown as { isOpen?: () => boolean } | undefined;

            mosques.push({
              id: p.id || `gmp-${lat}-${lng}`,
              name: p.displayName || 'Masjid',
              address: p.formattedAddress || 'Manzil aniqlanmadi',
              location: { lat, lng },
              distanceMeters: distance,
              rating: p.rating ?? undefined,
              userRatingCount: p.userRatingCount ?? undefined,
              isOpenNow: openingHours && typeof openingHours.isOpen === 'function' ? openingHours.isOpen() : undefined,
              phoneNumber: p.nationalPhoneNumber ?? undefined,
              websiteURI: p.websiteURI ?? undefined,
              googleMapsURI: p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
              photos: photoUrls,
            });
            placeIds.add(p.id || `gmp-${lat}-${lng}`);
          }
        }
      }
    } catch (err) {
      console.warn('Google Places searchNearby encountered an issue, attempting secondary sources:', err);
    }
  }

  // 2. If Google Places returned fewer than 15 mosques or encountered error,
  // query Overpass OSM to ensure the user gets every mosque in the neighborhood
  if (mosques.length < 15) {
    try {
      const overpassMosques = await fetchOverpassMosques(center, radiusMeters);
      for (const osm of overpassMosques) {
        const alreadyExists = mosques.some(
          (m) =>
            calculateDistanceMeters(m.location.lat, m.location.lng, osm.location.lat, osm.location.lng) < 60 ||
            m.name.toLowerCase().trim() === osm.name.toLowerCase().trim()
        );

        if (!alreadyExists) {
          mosques.push(osm);
        }
      }
    } catch (e) {
      console.warn('Overpass fetch skipped or network limited:', e);
    }
  }

  // 3. Fallback: If network is offline or zero results returned, load from cached storage
  if (mosques.length === 0) {
    const cached = getCachedMosques(center);
    if (cached.length > 0) {
      return cached;
    }
  } else {
    // Save to cache for offline availability
    saveMosquesToCache(center, mosques);
  }

  // Sort by nearest distance
  mosques.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

  return mosques;
}

/**
 * Fallback to OpenStreetMap Overpass API which contains nearly all mosques
 * registered in Uzbekistan and globally.
 */
async function fetchOverpassMosques(
  center: { lat: number; lng: number },
  radiusMeters: number
): Promise<MosquePlace[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${center.lat},${center.lng});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${center.lat},${center.lng});
      node["building"="mosque"](around:${radiusMeters},${center.lat},${center.lng});
      way["building"="mosque"](around:${radiusMeters},${center.lat},${center.lng});
    );
    out center 40;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  const results: MosquePlace[] = [];

  if (Array.isArray(data.elements)) {
    for (const el of data.elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags || {};
      const name =
        tags['name:uz'] ||
        tags['name'] ||
        tags['name:en'] ||
        tags['name:ru'] ||
        tags['official_name'] ||
        'Jome Masjidi';

      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const city = tags['addr:city'] || '';
      const addressParts = [city, street, housenumber].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const distance = calculateDistanceMeters(center.lat, center.lng, lat, lng);

      results.push({
        id: `osm-${el.type}-${el.id}`,
        name,
        address,
        location: { lat, lng },
        distanceMeters: distance,
        googleMapsURI: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        isOpenNow: true,
        hasWuduFacility: tags['toilets'] === 'yes' || tags['amenity'] === 'place_of_worship',
        hasWomenSection: tags['female'] === 'yes' || tags['women'] === 'yes',
      });
    }
  }

  return results;
}

/**
 * Text search for cities or neighborhoods (e.g., "Toshkent Chilonzor", "Samarqand")
 */
export async function searchMosquesByText(
  textQuery: string,
  userCenter?: { lat: number; lng: number }
): Promise<MosquePlace[]> {
  const mosques: MosquePlace[] = [];

  if (typeof window !== 'undefined' && 'google' in window && window.google?.maps) {
    try {
      const placesLib = (await window.google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      if (placesLib.Place && typeof placesLib.Place.searchByText === 'function') {
        const request: google.maps.places.SearchByTextRequest = {
          textQuery: `${textQuery} masjid mosque`,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'regularOpeningHours',
            'nationalPhoneNumber',
            'websiteURI',
            'googleMapsURI',
            'photos',
          ],
          locationBias: userCenter ? { lat: userCenter.lat, lng: userCenter.lng } : undefined,
          maxResultCount: 20,
        };

        const { places } = await placesLib.Place.searchByText(request);

        if (places && places.length > 0) {
          for (const p of places) {
            const loc = p.location;
            if (!loc) continue;

            const lat = typeof loc.lat === 'function' ? loc.lat() : (loc as unknown as { lat: number }).lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : (loc as unknown as { lng: number }).lng;

            const distance = userCenter
              ? calculateDistanceMeters(userCenter.lat, userCenter.lng, lat, lng)
              : undefined;

            let photoUrls: string[] = [];
            if (p.photos && p.photos.length > 0) {
              photoUrls = p.photos.slice(0, 3).map((photo: google.maps.places.Photo) => {
                try {
                  return photo.getURI({ maxWidth: 600, maxHeight: 400 });
                } catch {
                  return '';
                }
              }).filter(Boolean);
            }

            const openingHours = p.regularOpeningHours as unknown as { isOpen?: () => boolean } | undefined;

            mosques.push({
              id: p.id || `gmp-${lat}-${lng}`,
              name: p.displayName || 'Masjid',
              address: p.formattedAddress || 'Manzil aniqlanmadi',
              location: { lat, lng },
              distanceMeters: distance,
              rating: p.rating ?? undefined,
              userRatingCount: p.userRatingCount ?? undefined,
              isOpenNow: openingHours && typeof openingHours.isOpen === 'function' ? openingHours.isOpen() : undefined,
              phoneNumber: p.nationalPhoneNumber ?? undefined,
              websiteURI: p.websiteURI ?? undefined,
              googleMapsURI: p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
              photos: photoUrls,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Text search with Google Places encountered error:', err);
    }
  }

  return mosques;
}

function saveMosquesToCache(center: { lat: number; lng: number }, mosques: MosquePlace[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        center,
        mosques: mosques.slice(0, 30),
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

function getCachedMosques(center: { lat: number; lng: number }): MosquePlace[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.mosques)) {
      // Re-calculate distances to current center
      return parsed.mosques.map((m: MosquePlace) => ({
        ...m,
        distanceMeters: calculateDistanceMeters(center.lat, center.lng, m.location.lat, m.location.lng),
      }));
    }
  } catch (e) {
    console.warn('Cache read failed:', e);
  }
  return [];
}
