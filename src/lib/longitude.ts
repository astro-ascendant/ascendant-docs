export const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type Sign = (typeof SIGN_ORDER)[number];

/** Wrap an angle into the half-open range [0, 360). */
export function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

/** Sign containing an absolute sidereal longitude. */
export function signOf(longitude: number): Sign {
  if (!Number.isFinite(longitude)) {
    return "Aries";
  }
  return SIGN_ORDER[Math.floor(normalizeLongitude(longitude) / 30)] ?? "Aries";
}

/** Degrees elapsed inside the containing sign, in the range [0, 30). */
export function degreeInSign(longitude: number): number {
  return normalizeLongitude(longitude) % 30;
}

/**
 * Absolute sidereal longitude rendered as sign-relative degrees and arcminutes:
 * "1°51'". Minutes round to the nearest one; a value that would round up to
 * 30° is held at 29°59' so the degree never contradicts the sign shown beside
 * it. A missing or non-finite longitude renders as an empty string.
 */
export function formatLongitude(longitude: number | null | undefined): string {
  if (longitude === null || longitude === undefined || !Number.isFinite(longitude)) {
    return "";
  }
  const totalMinutes = Math.min(Math.round(degreeInSign(longitude) * 60), 29 * 60 + 59);
  const degrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${degrees}°${String(minutes).padStart(2, "0")}'`;
}
