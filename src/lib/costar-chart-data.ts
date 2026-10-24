import {
  BodyId,
  HouseSystem,
  Perspective,
  SiderealMode,
  ZodiacType,
  type CelestialPosition,
  type ChartData,
  type HouseCusp,
} from "@astrologer/astro-core";
import type { ChartResult, KpCuspRow } from "./chart";

const BODY_IDS: Record<string, BodyId> = {
  Sun: BodyId.Sun,
  Moon: BodyId.Moon,
  Mars: BodyId.Mars,
  Mercury: BodyId.Mercury,
  Jupiter: BodyId.Jupiter,
  Venus: BodyId.Venus,
  Saturn: BodyId.Saturn,
  Rahu: BodyId.TrueNode,
  Ketu: BodyId.SouthNode,
};

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

const PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
] as const;

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function cuspsFromKp(cusps: readonly KpCuspRow[]): HouseCusp[] {
  return [...cusps]
    .filter((cusp) => cusp.longitude !== null)
    .sort((a, b) => a.house - b.house)
    .map((cusp) => ({
      house: cusp.house,
      longitude: cusp.longitude as number,
      degree: normalize(cusp.longitude as number) % 30,
      sign: cusp.sign,
      emoji: SIGN_GLYPHS[cusp.sign] ?? "",
    }));
}

/** Which Placidus house a sidereal longitude falls in, from the KP cusps. */
function houseFor(longitude: number, cusps: readonly HouseCusp[]): number {
  if (cusps.length === 0) {
    return 1;
  }
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index];
    const end = cusps[(index + 1) % cusps.length];
    if (!start || !end) {
      continue;
    }
    const span = normalize(end.longitude - start.longitude) || 30;
    if (normalize(longitude - start.longitude) < span) {
      return start.house;
    }
  }
  return 1;
}

function bodiesFromResult(
  result: ChartResult,
  cusps: readonly HouseCusp[],
): CelestialPosition[] {
  const d1 = result.divisions.find((entry) => entry.division === 1);
  const bodies: CelestialPosition[] = [];
  for (const placement of d1?.placements ?? []) {
    const id = BODY_IDS[placement.body];
    if (id === undefined || placement.longitude === null) {
      continue;
    }
    bodies.push({
      id,
      name: placement.body,
      longitude: normalize(placement.longitude),
      degree: normalize(placement.longitude) % 30,
      latitude: 0,
      declination: 0,
      distance: 0,
      speed: 0,
      isRetrograde: placement.state === "Retrograde",
      house: houseFor(normalize(placement.longitude), cusps),
      sign: placement.sign,
      emoji: SIGN_GLYPHS[placement.sign] ?? "",
    });
  }
  return bodies;
}

function lunarPhase(
  bodies: readonly CelestialPosition[],
): ChartData["lunarPhase"] {
  const sun = bodies.find((body) => body.id === BodyId.Sun);
  const moon = bodies.find((body) => body.id === BodyId.Moon);
  const elongation =
    sun && moon ? normalize(moon.longitude - sun.longitude) : 0;
  return {
    phaseName:
      PHASE_NAMES[Math.floor(((elongation + 22.5) % 360) / 45)] ?? "New Moon",
    illumination: (1 - Math.cos((elongation * Math.PI) / 180)) / 2,
    age: (elongation / 360) * 29.530_59,
    isWaxing: elongation < 180,
  };
}

/**
 * Adapt the report's KP cusps and D1 placements to the visual schema used by
 * @astrologer/react-chart. Pure presentation data: the KP chart supplies the
 * Placidus cusps, the D1 division the planet longitudes.
 */
export function buildCostarChartData(result: ChartResult): ChartData | null {
  const houses = cuspsFromKp(result.kp.cusps);
  if (houses.length !== 12) {
    return null;
  }
  const asc = houses.find((house) => house.house === 1)?.longitude ?? 0;
  const mc = houses.find((house) => house.house === 10)?.longitude ?? 0;
  const bodies = bodiesFromResult(result, houses);
  return {
    bodies,
    houses,
    angles: {
      Asc: asc,
      MC: mc,
      Dsc: normalize(asc + 180),
      IC: normalize(mc + 180),
    },
    aspects: [],
    lunarPhase: lunarPhase(bodies),
    meta: {
      date: result.birth.utcIso,
      location: {
        latitude: result.birth.latitude,
        longitude: result.birth.longitude,
      },
      houseSystem: HouseSystem.Placidus,
      zodiacType: ZodiacType.Sidereal,
      siderealMode: SiderealMode.Krishnamurti,
      perspective: Perspective.Geocentric,
      bodies: bodies.map((body) => body.id),
    },
  };
}
