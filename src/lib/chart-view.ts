import {
  findCurrentPeriodIndex,
  signShortName,
  type ChartDashaPeriod,
  type ChartDivision,
  type ChartResult,
} from "./chart";
import { formatLongitude } from "./longitude";

const BODY_SHORT: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Lagna: "As",
  RISING: "As",
};

function bodyShortName(body: string): string {
  return BODY_SHORT[body] ?? body.slice(0, 2);
}

/** Fixed South Indian rasi boxes, clockwise from Pisces at top-left. */
export const SOUTH_INDIAN_LAYOUT = [
  { sign: "Pisces", area: "pisces" },
  { sign: "Aries", area: "aries" },
  { sign: "Taurus", area: "taurus" },
  { sign: "Gemini", area: "gemini" },
  { sign: "Cancer", area: "cancer" },
  { sign: "Leo", area: "leo" },
  { sign: "Virgo", area: "virgo" },
  { sign: "Libra", area: "libra" },
  { sign: "Scorpio", area: "scorpio" },
  { sign: "Sagittarius", area: "sagittarius" },
  { sign: "Capricorn", area: "capricorn" },
  { sign: "Aquarius", area: "aquarius" },
] as const;

export const SOUTH_INDIAN_GRID_TEMPLATE = `
"pisces aries taurus gemini"
"aquarius center center cancer"
"capricorn center center leo"
"sagittarius scorpio libra virgo"
`;

export interface DivisionOccupant {
  body: string;
  short: string;
  degree: string;
  retrograde: boolean;
  isLagna: boolean;
}

export interface DivisionCell {
  sign: string;
  area: string;
  signShort: string;
  house: number | null;
  isLagna: boolean;
  occupants: DivisionOccupant[];
}

export interface DivisionView {
  division: number;
  title: string;
  lagnaSign: string;
  lagnaDegree: string;
  cells: DivisionCell[];
  /** Screen-reader description of the whole chart. */
  label: string;
}

export interface DivisionViewInput {
  readonly lagna: {
    readonly sign: string;
    readonly longitude: number | null;
  };
  readonly division: ChartDivision;
}

/**
 * Sign-fixed South Indian chart: twelve rasi boxes stay in place, lagna
 * and planets sit in the sign they occupy. House numbers are counted
 * from the lagna sign when the division includes house data.
 */
export function buildDivisionView({
  lagna,
  division,
}: DivisionViewInput): DivisionView {
  const lagnaHouse = division.houses.find((house) => house.number === 1);
  const lagnaSign =
    division.division === 1 ? lagna.sign : (lagnaHouse?.sign ?? lagna.sign);
  const lagnaDegree =
    division.division === 1
      ? formatLongitude(lagna.longitude)
      : formatLongitude(lagnaHouse?.cusp);

  const cells = SOUTH_INDIAN_LAYOUT.map((slot) => {
    const house = division.houses.find((entry) => entry.sign === slot.sign);
    const occupants: DivisionOccupant[] = division.placements
      .filter((planet) => planet.sign === slot.sign)
      .sort(
        (a, b) =>
          (a.longitude ?? Number.POSITIVE_INFINITY) -
          (b.longitude ?? Number.POSITIVE_INFINITY),
      )
      .map((planet) => ({
        body: planet.body,
        short: bodyShortName(planet.body),
        degree: formatLongitude(planet.longitude),
        retrograde: planet.state === "Retrograde",
        isLagna: false,
      }));

    if (slot.sign === lagnaSign) {
      occupants.unshift({
        body: "Lagna",
        short: "As",
        degree: lagnaDegree,
        retrograde: false,
        isLagna: true,
      });
    }

    return {
      sign: slot.sign,
      area: slot.area,
      signShort: signShortName(slot.sign),
      house: house?.number ?? (slot.sign === lagnaSign ? 1 : null),
      isLagna: slot.sign === lagnaSign,
      occupants,
    };
  });

  const title = divisionTitle(division.division);
  return {
    division: division.division,
    title,
    lagnaSign,
    lagnaDegree,
    cells,
    label: describeDivisionView({ title, lagnaSign, lagnaDegree, cells }),
  };
}

function divisionTitle(division: number): string {
  if (division === 1) {
    return "Rashi";
  }
  if (division === 9) {
    return "Navamsha";
  }
  return `D${division}`;
}

function describeDivisionCell(cell: DivisionCell): string {
  const house = cell.house === null ? "" : `, house ${cell.house}`;
  if (cell.occupants.length === 0) {
    return `${cell.sign}${house}: empty`;
  }
  const bodies = cell.occupants
    .map((occupant) => {
      const retro = occupant.retrograde ? " retrograde" : "";
      return `${occupant.body}${retro} ${occupant.degree}`.trim();
    })
    .join(", ");
  return `${cell.sign}${house}: ${bodies}`;
}

function describeDivisionView({
  title,
  lagnaSign,
  lagnaDegree,
  cells,
}: Pick<
  DivisionView,
  "title" | "lagnaSign" | "lagnaDegree" | "cells"
>): string {
  return `${title} South Indian chart. Lagna ${lagnaSign} ${lagnaDegree}. ${cells
    .map(describeDivisionCell)
    .join(". ")}`;
}

export interface KpWheelCusp {
  house: number;
  sign: string;
  degree: string;
  longitude: number;
}

export interface KpWheelPlanet {
  body: string;
  short: string;
  degree: string;
  longitude: number;
  retrograde: boolean;
}

export interface KpWheelView {
  ascendant: number;
  lagnaSign: string;
  lagnaDegree: string;
  cusps: KpWheelCusp[];
  planets: KpWheelPlanet[];
}

export interface KpWheelInput {
  readonly kp: ChartResult["kp"];
  readonly d1: ChartDivision | undefined;
}

/** Fixed zodiac frame: Aries 0° at the top, longitudes running counterclockwise. */
export function fixedZodiacAngleFor(longitude: number): number {
  return (((90 + longitude) % 360) + 360) % 360;
}

/** Midpoint from angle a to angle b in increasing-longitude direction. */
export function circularMidAngle(a: number, b: number): number {
  const delta = (((b - a) % 360) + 360) % 360;
  return (a + delta / 2) % 360;
}

/**
 * Circular KP wheel data: unequal Placidus house cusps as absolute sidereal
 * longitudes plus D1 planet longitudes. Cusps or planets without a usable
 * degree are skipped.
 */
export function buildKpWheelView({ kp, d1 }: KpWheelInput): KpWheelView | null {
  const cusps: KpWheelCusp[] = [];
  for (const cusp of kp.cusps) {
    const longitude = cusp.longitude;
    if (longitude === null) {
      continue;
    }
    cusps.push({
      house: cusp.house,
      sign: cusp.sign,
      degree: formatLongitude(longitude),
      longitude,
    });
  }
  if (cusps.length === 0) {
    return null;
  }
  const first = cusps.find((cusp) => cusp.house === 1) ?? cusps[0];
  const planets: KpWheelPlanet[] = [];
  for (const planet of d1?.placements ?? []) {
    const longitude = planet.longitude;
    if (longitude === null) {
      continue;
    }
    planets.push({
      body: planet.body,
      short: bodyShortName(planet.body),
      degree: formatLongitude(longitude),
      longitude,
      retrograde: planet.state === "Retrograde",
    });
  }
  return {
    ascendant: first?.longitude ?? 0,
    lagnaSign: first?.sign ?? "",
    lagnaDegree: first?.degree ?? "",
    cusps,
    planets,
  };
}

export interface HeadlineInput {
  readonly lagna: {
    readonly sign: string;
    readonly longitude: number | null;
  };
  readonly d1: ChartDivision | undefined;
  readonly vimshottari: readonly ChartDashaPeriod[];
}

export interface HeadlineFacts {
  ascendant: string;
  moon: string;
  star: string;
  mahadasha: string;
}

/** Headline facts under the name, with the current mahadasha evaluated at `now`. */
export function buildHeadlineView(
  { lagna, d1, vimshottari }: HeadlineInput,
  now: string,
): HeadlineFacts {
  const dashaIndex = findCurrentPeriodIndex(vimshottari, now);
  const currentDasha =
    dashaIndex === -1 ? null : (vimshottari[dashaIndex] ?? null);
  const moon =
    d1?.placements.find((placement) => placement.body === "Moon") ?? null;

  return {
    ascendant: `${lagna.sign} ${formatLongitude(lagna.longitude)}`,
    moon: moon ? `${moon.sign} ${formatLongitude(moon.longitude)}` : "—",
    star:
      moon && moon.star !== ""
        ? `${moon.star}${moon.pada ? ` · Pada ${moon.pada}` : ""}`
        : "—",
    mahadasha: currentDasha ? currentDasha.mahadasha : "—",
  };
}
