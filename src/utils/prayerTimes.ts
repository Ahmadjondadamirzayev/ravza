/**
 * Astronomical Prayer Times calculation based on coordinates and exact date.
 * Automatically recalculates for every new day of the year.
 */
import { PrayerTimes } from '../types/mosque';

const UZBEK_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

export function calculatePrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  timezoneOffsetHours?: number
): PrayerTimes {
  const tz =
    timezoneOffsetHours !== undefined
      ? timezoneOffsetHours
      : -date.getTimezoneOffset() / 60;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian Day
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  const d = jd - 2451545.0; // days since J2000.0

  // Sun coordinates
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(deg2rad(g)) + 0.02 * Math.sin(deg2rad(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * d; // obliquity
  const RA = (rad2deg(Math.atan2(Math.cos(deg2rad(e)) * Math.sin(deg2rad(L)), Math.cos(deg2rad(L))))) / 15;
  const dec = rad2deg(Math.asin(Math.sin(deg2rad(e)) * Math.sin(deg2rad(L))));

  // Equation of time in hours
  const eqt = q / 15 - (RA < 0 ? RA + 24 : RA);

  // Solar noon
  const noon = 12 + tz - lng / 15 - eqt;

  // Sun angles (Muslim World League standard)
  const fajrAngle = 18;
  const ishaAngle = 17;

  // Hour angles
  const fajrHA = calculateHourAngle(-fajrAngle, lat, dec);
  const sunriseHA = calculateHourAngle(-0.833, lat, dec);
  const asrHA = calculateAsrHourAngle(1, lat, dec); // Standard shadow factor
  const maghribHA = calculateHourAngle(-0.833, lat, dec);
  const ishaHA = calculateHourAngle(-ishaAngle, lat, dec);

  const fajrTime = noon - fajrHA;
  const sunriseTime = noon - sunriseHA;
  const dhuhrTime = noon;
  const asrTime = noon + asrHA;
  const maghribTime = noon + maghribHA;
  const ishaTime = noon + ishaHA;

  const times = {
    fajr: formatHour(fajrTime),
    sunrise: formatHour(sunriseTime),
    dhuhr: formatHour(dhuhrTime),
    asr: formatHour(asrTime),
    maghrib: formatHour(maghribTime),
    isha: formatHour(ishaTime),
  };

  // Find next prayer and calculate live minutes remaining
  const nowHours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const prayerHoursList = [
    { name: 'Bomdod', hour: fajrTime },
    { name: 'Quyosh', hour: sunriseTime },
    { name: 'Peshin', hour: dhuhrTime },
    { name: 'Asr', hour: asrTime },
    { name: 'Shom', hour: maghribTime },
    { name: 'Xufton', hour: ishaTime },
  ];

  let nextPrayer = prayerHoursList[0];
  let minutesToNext = 0;

  for (const prayer of prayerHoursList) {
    if (prayer.hour > nowHours) {
      nextPrayer = prayer;
      minutesToNext = Math.round((prayer.hour - nowHours) * 60);
      break;
    }
  }

  if (nextPrayer === prayerHoursList[0] && nowHours >= ishaTime) {
    // Next prayer is tomorrow's Fajr
    minutesToNext = Math.round((24 - nowHours + fajrTime) * 60);
  }

  const dateStr = `${day}-${UZBEK_MONTHS[date.getMonth()]}, ${year}-yil`;

  return {
    ...times,
    nextPrayerName: nextPrayer.name,
    minutesToNextPrayer: Math.max(1, minutesToNext),
    dateStr,
  };
}

/**
 * Fetches verified online timings from Aladhan API if internet is available,
 * with graceful fallback to local astronomical formula.
 */
export async function getLivePrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date()
): Promise<PrayerTimes> {
  const localTimes = calculatePrayerTimes(lat, lng, date);

  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.timings) {
        const t = data.data.timings;
        const hijri = data.data.date?.hijri;
        const hijriStr = hijri ? `${hijri.day}-${hijri.month?.en} ${hijri.year}` : undefined;

        // Parse online times
        const cleanTime = (str: string) => str ? str.split(' ')[0].substring(0, 5) : '';

        return {
          fajr: cleanTime(t.Fajr) || localTimes.fajr,
          sunrise: cleanTime(t.Sunrise) || localTimes.sunrise,
          dhuhr: cleanTime(t.Dhuhr) || localTimes.dhuhr,
          asr: cleanTime(t.Asr) || localTimes.asr,
          maghrib: cleanTime(t.Maghrib) || localTimes.maghrib,
          isha: cleanTime(t.Isha) || localTimes.isha,
          nextPrayerName: localTimes.nextPrayerName,
          minutesToNextPrayer: localTimes.minutesToNextPrayer,
          dateStr: localTimes.dateStr,
          hijriStr,
        };
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.log('Using local astronomical prayer time calculation');
  }

  return localTimes;
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function calculateHourAngle(angle: number, lat: number, dec: number): number {
  const cosHA =
    (Math.sin(deg2rad(angle)) - Math.sin(deg2rad(lat)) * Math.sin(deg2rad(dec))) /
    (Math.cos(deg2rad(lat)) * Math.cos(deg2rad(dec)));
  if (cosHA > 1) return 0;
  if (cosHA < -1) return 12;
  return rad2deg(Math.acos(cosHA)) / 15;
}

function calculateAsrHourAngle(factor: number, lat: number, dec: number): number {
  const d = Math.abs(lat - dec);
  const acotAngle = rad2deg(Math.atan(1 / (factor + Math.tan(deg2rad(d)))));
  const cosHA =
    (Math.sin(deg2rad(acotAngle)) - Math.sin(deg2rad(lat)) * Math.sin(deg2rad(dec))) /
    (Math.cos(deg2rad(lat)) * Math.cos(deg2rad(dec)));
  if (cosHA > 1) return 0;
  if (cosHA < -1) return 12;
  return rad2deg(Math.acos(cosHA)) / 15;
}

function formatHour(timeInHours: number): string {
  let normalized = (timeInHours + 24) % 24;
  const hours = Math.floor(normalized);
  const minutes = Math.floor((normalized - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
