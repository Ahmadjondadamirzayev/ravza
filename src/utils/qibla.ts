/**
 * Qibla direction and distance calculation from any coordinate to Kaaba (Mecca)
 */

export const KAABA_COORDINATES = {
  lat: 21.422487,
  lng: 39.826206,
};

/**
 * Calculates Qibla direction in degrees clockwise from True North (0° = North, 90° = East, 180° = South, 270° = West)
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = (latitude * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.lat * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDINATES.lng - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;

  return Math.round(qibla * 10) / 10;
}

/**
 * Calculates great-circle distance to Kaaba in kilometers
 */
export function calculateDistanceToKaabaKm(latitude: number, longitude: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_COORDINATES.lat - latitude) * Math.PI) / 180;
  const dLng = ((KAABA_COORDINATES.lng - longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude * Math.PI) / 180) *
      Math.cos((KAABA_COORDINATES.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Haversine distance in meters between any two coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}
