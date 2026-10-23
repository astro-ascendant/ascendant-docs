import type {
  Argala,
  ArudhaPada,
  CharaKarakas,
  Chart,
  Dasha,
  Karakamsha,
  RashiDrishti,
  SAV,
  Upapada,
} from "astro-ascendant";
import { DateTime } from "effect";
import type { Effect } from "effect";
import {
  uniqueHousesInOrder,
  type ChartDashaPeriod,
  type ChartResult,
  type KpCuspRow,
  type KpSignificatorRow,
} from "@/lib/chart";
import { normalizeLongitude } from "@/lib/longitude";

export const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const PLANET_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;

const SAV_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

const RASHIS = [
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

type DashaResult = Effect.Success<ReturnType<typeof Dasha.calculate>>;
type CharaResult = Effect.Success<ReturnType<typeof Dasha.calculateChara>>;
type SthiraResult = Effect.Success<ReturnType<typeof Dasha.calculateSthira>>;
type SavResult = Effect.Success<ReturnType<typeof SAV.calculate>>;
type KarakasResult = Effect.Success<ReturnType<typeof CharaKarakas.calculate>>;
type KarakamshaResult = Effect.Success<ReturnType<typeof Karakamsha.calculate>>;
type UpapadaResult = Effect.Success<ReturnType<typeof Upapada.calculate>>;
type DrishtiResult = Effect.Success<ReturnType<typeof RashiDrishti.calculate>>;
type ArgalaResult = Effect.Success<ReturnType<typeof Argala.calculate>>;
export type ArudhaMappingResult = Effect.Success<ReturnType<typeof ArudhaPada.calculate>>;

/** Optional calculations, already resolved from their Effect results. */
export interface ChartMappingOptional {
  readonly vimshottari: DashaResult | null;
  readonly kpVimshottari: DashaResult | null;
  readonly chara: CharaResult | null;
  readonly sthira: SthiraResult | null;
  readonly sav: SavResult | null;
  readonly karakas: KarakasResult | null;
  readonly karakamsha: KarakamshaResult | null;
  readonly upapada: UpapadaResult | null;
  readonly drishti: DrishtiResult | null;
  readonly argala: ArgalaResult | null;
  readonly arudha: readonly (ArudhaMappingResult | null)[];
}

export interface ChartMappingInput {
  readonly calculation: Chart.ChartCalculation;
  readonly kpCalculation: Chart.ChartCalculation;
  readonly birth: ChartResult["birth"];
  readonly optional: ChartMappingOptional;
}

/**
 * Pure assembly of the chart contract: the library's calculations and the
 * optional Jaimini, dasha, and Ashtakavarga results become a `ChartResult`.
 * No Effect, no ephemeris, no clock.
 */
export function toChartResult(input: ChartMappingInput): ChartResult {
  const { calculation, kpCalculation, birth, optional } = input;
  const lagna = d1Lagna(calculation);
  return {
    birth,
    // Report the method the engine actually used.
    astroParams: {
      ayanamsa: calculation.astroParams.ayanamsa,
      houseSystem: calculation.astroParams.houseSystem,
    },
    lagna: {
      sign: lagna.sign,
      longitude: lagna.longitude,
      house: 1,
    },
    kp: readKpChart(kpCalculation, toDashaPeriods(optional.kpVimshottari ?? [])),
    divisions: readDivisions(calculation, calculation.placements.planets),
    dasha: {
      vimshottari: toDashaPeriods(optional.vimshottari ?? []),
      chara: toDashaPeriods(optional.chara?.mahadashas ?? []),
      sthira: toDashaPeriods(optional.sthira?.mahadashas ?? []),
    },
    jaimini: readJaimini(optional),
    sav: readSav(optional.sav),
  };
}

function findD1(calculation: Chart.ChartCalculation): Chart.Chart {
  return calculation.charts.find((chart) => chart.division === 1) ?? calculation.charts[0];
}

export function d1Lagna(calculation: Chart.ChartCalculation): {
  sign: Chart.Rashis;
  longitude: number | null;
} {
  const d1 = findD1(calculation);
  const lagnaHouse =
    HOUSES.map((houseNumber) => d1.houses[houseNumber]).find((house) => house.lagna !== null) ??
    d1.houses[1];
  return {
    sign: lagnaHouse.sign,
    longitude: lagnaHouse.lagna?.longitude ?? null,
  };
}

const NAKSHATRA_SPAN = 360 / 27;
const NAKSHATRA_LORD_CYCLE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;
const VIMSHOTTARI_YEARS: Record<(typeof NAKSHATRA_LORD_CYCLE)[number], number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const KP_SIGN_LORDS = [
  "Mars",
  "Venus",
  "Mercury",
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Saturn",
  "Jupiter",
] as const;

function kpSignLordOf(longitude: number): string {
  const signIndex = Math.floor(normalizeLongitude(longitude) / 30);
  return KP_SIGN_LORDS[signIndex] ?? "";
}

function kpStarLordOf(longitude: number): string {
  const position = normalizeLongitude(longitude);
  const starIndex = Math.floor(position / NAKSHATRA_SPAN) % NAKSHATRA_LORD_CYCLE.length;
  return NAKSHATRA_LORD_CYCLE[starIndex] ?? "";
}

function kpSubLord(longitude: number): string {
  const position = normalizeLongitude(longitude);
  const starIndex = Math.floor(position / NAKSHATRA_SPAN) % NAKSHATRA_LORD_CYCLE.length;
  const starLord = NAKSHATRA_LORD_CYCLE[starIndex] ?? "Ketu";
  const ratio = (position % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  const start = NAKSHATRA_LORD_CYCLE.indexOf(starLord);
  let elapsed = 0;
  for (let offset = 0; offset < NAKSHATRA_LORD_CYCLE.length; offset += 1) {
    const planet = NAKSHATRA_LORD_CYCLE[(start + offset) % NAKSHATRA_LORD_CYCLE.length] ?? starLord;
    const width = VIMSHOTTARI_YEARS[planet] / 120;
    if (ratio < elapsed + width) {
      return planet;
    }
    elapsed += width;
  }
  return starLord;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function dignityLabel(
  dignities: readonly (
    | "EXALTED"
    | "MOOLA_TRIKONA"
    | "OWN"
    | "FRIEND"
    | "NEUTRAL"
    | "ENEMY"
    | "DEBILITATED"
  )[],
): string {
  const meaningful = dignities.find(
    (entry) =>
      entry === "EXALTED" ||
      entry === "MOOLA_TRIKONA" ||
      entry === "OWN" ||
      entry === "DEBILITATED",
  );
  return meaningful ? titleCase(meaningful) : "";
}

function toIsoDate(moment: DateTime.Utc): string {
  return DateTime.toDateUtc(moment).toISOString();
}

function toDashaPeriods(
  periods: readonly {
    readonly mahadasha: string;
    readonly start: DateTime.Utc;
    readonly end: DateTime.Utc;
    readonly antardashas: readonly {
      readonly antardasha: string;
      readonly start: DateTime.Utc;
      readonly end: DateTime.Utc;
    }[];
  }[],
): ChartDashaPeriod[] {
  return periods.map((period) => ({
    mahadasha: period.mahadasha,
    start: toIsoDate(period.start),
    end: toIsoDate(period.end),
    antardashas: period.antardashas.map((antara) => ({
      antardasha: antara.antardasha,
      start: toIsoDate(antara.start),
      end: toIsoDate(antara.end),
    })),
  }));
}

function readDivisions(
  calculation: Chart.ChartCalculation,
  sourcePlanets: readonly Chart.SourcePlanet[],
): ChartResult["divisions"] {
  return calculation.charts.map((chart) => {
    const division = chart.division;
    const planetHouse = new Map<string, number>();
    const houses: ChartResult["divisions"][number]["houses"] = HOUSES.map((houseNumber) => {
      const house = chart.houses[houseNumber];
      const occupants = house.planets.map((planet) => {
        planetHouse.set(planet.name, houseNumber);
        return planet.name;
      });
      return {
        number: houseNumber,
        sign: house.sign,
        cusp: house.cusp ?? null,
        lord: house.signLord ?? "",
        occupants,
        significators: (house.significations ?? []).filter((entry) => entry !== ""),
      };
    });
    const isSourceDivision = division === 1;
    const placements = HOUSES.flatMap((houseNumber) =>
      chart.houses[houseNumber].planets.map((planet) => {
        const source = sourcePlanets.find((item) => item.name === planet.name);
        return {
          body: planet.name,
          sign: planet.sign.name,
          longitude: planet.longitude,
          house: planetHouse.get(planet.name) ?? 0,
          // Star and pada are source (D1) evidence; divisional charts
          // reuse projected signs and houses, so only D1 rows carry them.
          star: isSourceDivision ? (source?.star.name ?? "") : "",
          pada: isSourceDivision ? (source?.star.pada ?? null) : null,
          state: planet.is_retrograde ? "Retrograde" : dignityLabel(planet.in_sign),
        };
      }),
    );
    return { division, placements, houses };
  });
}

function signifyingHousesOf(signification: Chart.PlanetSignification | undefined): number[] {
  if (signification === undefined) {
    return [];
  }
  return uniqueHousesInOrder([
    signification.level1,
    signification.level2,
    signification.level3,
    signification.level4,
  ]);
}

function planetSignification(
  chart: Chart.Chart,
  planet: string,
): Chart.PlanetSignification | undefined {
  if (planet === "" || planet === "Lagna") {
    return undefined;
  }
  return chart.planetSignifications?.[planet as Chart.Planets];
}

function readKpChart(
  calculation: Chart.ChartCalculation,
  vimshottari: ChartDashaPeriod[],
): ChartResult["kp"] {
  const d1 = findD1(calculation);
  const sourceByName = new Map(
    calculation.placements.planets.map((planet) => [planet.name, planet]),
  );
  const planetByName = new Map<string, Chart.Planet>();
  for (const houseNumber of HOUSES) {
    for (const planet of d1.houses[houseNumber].planets) {
      planetByName.set(planet.name, planet);
    }
  }

  const rows: KpSignificatorRow[] = [];
  const lagnaHouse = d1.houses[1];
  const lagnaSubLord = lagnaHouse.subLord ?? "";
  rows.push({
    name: "Lagna",
    signLord: lagnaHouse.signLord ?? "",
    starLord: lagnaHouse.starLord ?? "",
    subLord: lagnaSubLord,
    signifyingHouses: signifyingHousesOf(planetSignification(d1, lagnaSubLord)),
  });

  for (const name of PLANET_ORDER) {
    const planet = planetByName.get(name);
    const source = sourceByName.get(name);
    rows.push({
      name,
      signLord: planet?.sign.lord ?? "",
      starLord: source?.star.lord ?? "",
      subLord: planet === undefined ? "" : kpSubLord(planet.longitude),
      signifyingHouses: signifyingHousesOf(planetSignification(d1, name)),
    });
  }

  const cusps: KpCuspRow[] = HOUSES.map((houseNumber) => {
    const house = d1.houses[houseNumber];
    const cusp = house.cusp;
    if (cusp === undefined) {
      return {
        house: houseNumber,
        sign: house.sign,
        longitude: null,
        signLord: house.signLord ?? "",
        starLord: house.starLord ?? "",
        subLord: house.subLord ?? "",
        subSubLord: "",
      };
    }
    return {
      house: houseNumber,
      sign: house.sign,
      longitude: cusp,
      signLord: kpSignLordOf(cusp),
      starLord: kpStarLordOf(cusp),
      subLord: kpSubLord(cusp),
      subSubLord: house.subSubLord ?? "",
    };
  });

  return {
    astroParams: {
      ayanamsa: calculation.astroParams.ayanamsa,
      houseSystem: calculation.astroParams.houseSystem,
    },
    rows,
    cusps,
    dasha: { vimshottari },
  };
}

function readJaimini(optional: ChartMappingOptional): ChartResult["jaimini"] {
  const karakas: ChartResult["jaimini"]["karakas"] = [];
  if (optional.karakas) {
    for (const [role, holders] of Object.entries(optional.karakas.assignments)) {
      for (const holder of holders) {
        karakas.push({ role, planet: holder.planet });
      }
    }
  }
  return {
    karakas,
    karakamsha: optional.karakamsha?.placements[0]?.sign ?? "",
    upapada: optional.upapada?.sign ?? "",
    arudha: HOUSES.map((house, index) => ({
      house,
      pada: optional.arudha[index]?.sign ?? "",
    })),
    drishti: [...(optional.drishti?.targets ?? [])],
    argala: {
      supporting: (optional.argala?.supporting ?? []).map((relation) => relation.sign),
      obstructing: (optional.argala?.obstructing ?? []).map((relation) => relation.sign),
    },
  };
}

function readSav(sav: SavResult | null): ChartResult["sav"] {
  if (sav === null) {
    return { signs: [...RASHIS], rows: [], signTotals: [], total: 0 };
  }
  return {
    signs: [...RASHIS],
    rows: SAV_PLANETS.map((planet) => ({
      planet,
      points: RASHIS.map((sign) => sav.bhinna[planet][sign]),
      total: sav.totals[planet],
    })),
    signTotals: RASHIS.map((sign) => sav.sarva[sign]),
    total: sav.totals.sarva,
  };
}
