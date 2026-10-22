import {
  Argala,
  ArudhaPada,
  AstroParams,
  CharaKarakas,
  Chart,
  Dasha,
  Karakamsha,
  RashiDrishti,
  SAV,
  Swisseph,
  Upapada,
} from "astro-ascendant";
import { Data, DateTime, Effect, Layer, Option } from "effect";
import {
  ALL_DIVISIONS,
  uniqueHousesInOrder,
  type ChartDashaPeriod,
  type ChartResult,
  type KpCuspRow,
  type KpSignificatorRow,
} from "@/lib/chart";

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

type RashiName = (typeof RASHIS)[number];

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const SAV_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

export interface CalculateChartInput {
  readonly utcIso: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly place: string;
  readonly name?: string;
  readonly sex?: "Male" | "Female";
}

export class CalculateChartError extends Data.TaggedError("CalculateChartError")<{
  readonly message: string;
}> {}

const AstroLayer = Layer.mergeAll(
  AstroParams.layer({ ayanamsa: "Lahiri", houseSystem: "WholeSign" }),
  Swisseph.SwissephLayer,
);

const KpAstroLayer = Layer.mergeAll(AstroParams.DefaultAstroParams, Swisseph.SwissephLayer);

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

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

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

function degreeInSign(longitude: number): string {
  return (normalizeLongitude(longitude) % 30).toFixed(1);
}

function formatDegree(degree: number, fallbackLongitude: number): string {
  if (Number.isFinite(degree) && degree <= 30) {
    return degree.toFixed(1);
  }
  return degreeInSign(fallbackLongitude);
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

function describeError(error: unknown): string {
  if (error instanceof Error && error.message !== "") {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "_tag" in error) {
    return String((error as { _tag: unknown })._tag);
  }
  try {
    const json = JSON.stringify(error);
    return json === undefined ? "Calculation failed." : json;
  } catch {
    return "Calculation failed.";
  }
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
        cusp: house.cusp?.toFixed(1) ?? "",
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
          degree: formatDegree(planet.degree, planet.longitude),
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

function readD1Lagna(chart: Chart.Chart): {
  sign: RashiName;
  degree: string;
} {
  const lagnaHouse =
    HOUSES.map((houseNumber) => chart.houses[houseNumber]).find((house) => house.lagna !== null) ??
    chart.houses[1];
  return {
    sign: lagnaHouse.sign,
    degree: lagnaHouse.lagna?.degree.toFixed(1) ?? "",
  };
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
  const d1 = calculation.charts.find((chart) => chart.division === 1) ?? calculation.charts[0];
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
        degree: "",
        signLord: house.signLord ?? "",
        starLord: house.starLord ?? "",
        subLord: house.subLord ?? "",
        subSubLord: "",
      };
    }
    return {
      house: houseNumber,
      sign: house.sign,
      degree: degreeInSign(cusp),
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

export function calculateChart(
  input: CalculateChartInput,
): Effect.Effect<ChartResult, CalculateChartError> {
  const program = Effect.gen(function* () {
    const moment = Chart.Moment.make({
      date: DateTime.makeUnsafe(input.utcIso),
    });
    const chartInput = Chart.ChartParams.make({
      moment,
      latitude: input.latitude,
      longitude: input.longitude,
      ...(input.sex ? { sex: input.sex } : {}),
    });
    const calculation = yield* Chart.generate(chartInput, [...ALL_DIVISIONS]);
    const kpCalculation = yield* Chart.generate(chartInput, [1]).pipe(Effect.provide(KpAstroLayer));
    // The KP dasha follows the KP chart's own ayanamsa, so its period
    // boundaries can differ from the Lahiri timeline.
    const kpVimshottari = yield* Effect.option(Dasha.calculate(moment, kpCalculation.placements));
    const placements = calculation.placements;

    const d1 = calculation.charts.find((chart) => chart.division === 1) ?? calculation.charts[0];
    const { sign: lagnaSign, degree: lagnaDegree } = readD1Lagna(d1);
    const vimshottari = yield* Effect.option(Dasha.calculate(moment, placements));
    const chara = yield* Effect.option(Dasha.calculateChara(moment, placements));
    const sthira = yield* Effect.option(Dasha.calculateSthira(moment, placements));
    const sav = yield* Effect.option(SAV.calculate(placements));
    const karakas = yield* Effect.option(CharaKarakas.calculate(placements));
    const karakamsha = yield* Effect.option(Karakamsha.calculate(placements));
    const upapada = yield* Effect.option(Upapada.calculate(placements));
    const drishti = yield* Effect.option(RashiDrishti.calculate(lagnaSign));
    const argala = yield* Effect.option(
      Argala.calculate(placements, { kind: "Sign", sign: lagnaSign }),
    );

    const arudha: ChartResult["jaimini"]["arudha"] = [];
    for (const house of HOUSES) {
      const pada = yield* Effect.option(ArudhaPada.calculate(placements, house));
      arudha.push({
        house,
        pada: Option.getOrElse(pada, () => null)?.sign ?? "",
      });
    }

    const karakaRows: ChartResult["jaimini"]["karakas"] = [];
    const assignments = Option.getOrElse(karakas, () => null)?.assignments;
    if (assignments) {
      for (const [role, holders] of Object.entries(assignments)) {
        for (const holder of holders) {
          karakaRows.push({ role, planet: holder.planet });
        }
      }
    }

    const savResult = Option.getOrElse(sav, () => null);
    const savTable: ChartResult["sav"] =
      savResult === null
        ? { signs: [...RASHIS], rows: [], signTotals: [], total: 0 }
        : {
            signs: [...RASHIS],
            rows: SAV_PLANETS.map((planet) => ({
              planet,
              points: RASHIS.map((sign) => savResult.bhinna[planet][sign]),
              total: savResult.totals[planet],
            })),
            signTotals: RASHIS.map((sign) => savResult.sarva[sign]),
            total: savResult.totals.sarva,
          };

    const result: ChartResult = {
      birth: {
        name: input.name ?? "",
        utcIso: input.utcIso,
        place: input.place,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      // Report the method the engine actually used.
      astroParams: {
        ayanamsa: calculation.astroParams.ayanamsa,
        houseSystem: calculation.astroParams.houseSystem,
      },
      lagna: {
        sign: lagnaSign,
        degree: lagnaDegree,
        house: 1,
      },
      kp: readKpChart(kpCalculation, toDashaPeriods(Option.getOrElse(kpVimshottari, () => []))),
      divisions: readDivisions(calculation, placements.planets),
      dasha: {
        vimshottari: toDashaPeriods(Option.getOrElse(vimshottari, () => [])),
        chara: toDashaPeriods(Option.getOrElse(chara, () => null)?.mahadashas ?? []),
        sthira: toDashaPeriods(Option.getOrElse(sthira, () => null)?.mahadashas ?? []),
      },
      jaimini: {
        karakas: karakaRows,
        karakamsha: Option.getOrElse(karakamsha, () => null)?.placements[0]?.sign ?? "",
        upapada: Option.getOrElse(upapada, () => null)?.sign ?? "",
        arudha,
        drishti: [...(Option.getOrElse(drishti, () => null)?.targets ?? [])],
        argala: {
          supporting: (Option.getOrElse(argala, () => null)?.supporting ?? []).map(
            (relation) => relation.sign,
          ),
          obstructing: (Option.getOrElse(argala, () => null)?.obstructing ?? []).map(
            (relation) => relation.sign,
          ),
        },
      },
      sav: savTable,
    };
    return result;
  });

  return program.pipe(
    Effect.catchDefect((defect) =>
      Effect.fail(new CalculateChartError({ message: describeError(defect) })),
    ),
    Effect.mapError((error) =>
      error instanceof CalculateChartError
        ? error
        : new CalculateChartError({ message: describeError(error) }),
    ),
    Effect.provide(AstroLayer),
  );
}
