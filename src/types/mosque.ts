export interface MosquePlace {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distanceMeters?: number;
  rating?: number;
  userRatingCount?: number;
  isOpenNow?: boolean;
  phoneNumber?: string;
  websiteURI?: string;
  googleMapsURI?: string;
  photos?: string[];
  capacity?: number;
  hasWuduFacility?: boolean;
  hasWomenSection?: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  addressName?: string;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextPrayerName: string;
  minutesToNextPrayer: number;
  dateStr?: string;
  hijriStr?: string;
}
