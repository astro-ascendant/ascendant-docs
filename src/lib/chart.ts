export interface ChartBirthInput {
  name: string;
  date: string;
  time: string;
  utcOffsetMinutes: number;
  place: string;
  latitude: number;
  longitude: number;
  sex?: "Male" | "Female";
}

export type ChartFieldKey = "name" | "date" | "time" | "place";

export interface ChartInputValidation {
  ok: boolean;
  fields: Partial<Record<ChartFieldKey, string>>;
}

function isFiniteLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isFiniteLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function validateChartInput(input: ChartBirthInput): ChartInputValidation {
  const fields: ChartInputValidation["fields"] = {};
  if (input.name.trim() === "") {
    fields.name = "Enter a name.";
  }
  if (input.date.trim() === "") {
    fields.date = "Enter a birth date.";
  }
  if (input.time.trim() === "") {
    fields.time = "Enter a birth time.";
  }
  if (input.place.trim() === "") {
    fields.place = "Enter a birth place.";
  } else if (!isFiniteLatitude(input.latitude) || !isFiniteLongitude(input.longitude)) {
    fields.place = "Choose a birth place from the suggestions.";
  }
  return { ok: Object.keys(fields).length === 0, fields };
}

export function toUtcIso(input: { date: string; time: string; utcOffsetMinutes: number }): string {
  const local = new Date(
    Date.UTC(
      Number(input.date.slice(0, 4)),
      Number(input.date.slice(5, 7)) - 1,
      Number(input.date.slice(8, 10)),
      Number(input.time.slice(0, 2)),
      Number(input.time.slice(3, 5)),
    ),
  );
  return new Date(local.getTime() - input.utcOffsetMinutes * 60_000).toISOString();
}

export const ALL_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60] as const;

export interface ChartPlacement {
  body: string;
  sign: string;
  degree: string;
  house: number;
  star: string;
  pada: number | null;
  state: string;
}

export interface ChartHouse {
  number: number;
  sign: string;
  cusp: string;
  lord: string;
  occupants: string[];
  significators: string[];
}

export interface ChartDivision {
  division: number;
  placements: ChartPlacement[];
  houses: ChartHouse[];
}

export interface ChartDashaPeriod {
  mahadasha: string;
  start: string;
  end: string;
  antardashas: { antardasha: string; start: string; end: string }[];
}

export interface KpSignificatorRow {
  name: string;
  signLord: string;
  starLord: string;
  subLord: string;
  signifyingHouses: number[];
}

export interface KpCuspRow {
  house: number;
  sign: string;
  degree: string;
  signLord: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
}

export interface KpChart {
  astroParams: {
    ayanamsa: string;
    houseSystem: string;
  };
  rows: KpSignificatorRow[];
  cusps: KpCuspRow[];
}

export interface ChartResult {
  birth: {
    name: string;
    utcIso: string;
    place: string;
    latitude: number;
    longitude: number;
  };
  astroParams: {
    ayanamsa: string;
    houseSystem: string;
  };
  lagna: {
    sign: string;
    degree: string;
    house: number;
  };
  kp: KpChart;
  divisions: ChartDivision[];
  dasha: {
    vimshottari: ChartDashaPeriod[];
    chara: ChartDashaPeriod[];
    sthira: ChartDashaPeriod[];
  };
  jaimini: {
    karakas: { role: string; planet: string }[];
    karakamsha: string;
    upapada: string;
    arudha: { house: number; pada: string }[];
    drishti: string[];
    argala: {
      supporting: string[];
      obstructing: string[];
    };
  };
  sav: {
    signs: string[];
    rows: { planet: string; points: number[]; total: number }[];
    signTotals: number[];
    total: number;
  };
}

/** First-seen order across KP signification levels (star, occupancy, ownership). */
export function uniqueHousesInOrder(groups: readonly (readonly number[])[]): number[] {
  const seen = new Set<number>();
  const houses: number[] = [];
  for (const group of groups) {
    for (const house of group) {
      if (!seen.has(house)) {
        seen.add(house);
        houses.push(house);
      }
    }
  }
  return houses;
}

export function formatSignifyingHouses(houses: readonly number[]): string {
  return houses.length === 0 ? "—" : houses.join(", ");
}

export function toPlacementRows(result: ChartResult, division: number): ChartPlacement[] {
  const match = result.divisions.find((entry) => entry.division === division);
  if (!match) {
    return [];
  }
  return [
    {
      body: "Lagna",
      sign: result.lagna.sign,
      degree: result.lagna.degree,
      house: result.lagna.house,
      star: "",
      pada: null,
      state: "",
    },
    ...match.placements,
  ];
}

const SIGN_ORDER = [
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
];

function parseDegreeStart(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Rows for the sign/house chart: every house 1..12 in order, each with its
 * cusp starting degree and its occupants (RISING first in house 1, then
 * planets by longitude). Empty houses render a single blank row so all 12
 * houses are always visible. Adjacent rows sharing a sign or belonging to
 * the same house merge via signSpan/houseSpan (0 = merged into the row
 * above). The D1 lagna comes from the result; other divisions read house 1.
 */
export interface HouseChartRow {
  label: string;
  sign: string; // sign of the displayed body
  degree: string; // degree of displayed body
  house: number; // house containing displayed body
  cusp: string; // cusp of the house
  cuspSign: string; // sign containing the cusp
  empty: boolean;
  signSpan: number;
  houseSpan: number;
}

/** Absolute cusp longitude ("151.9") -> sign-relative degree ("1.9°"). */
export function formatCuspDegree(cusp: string): string {
  const longitude = Number.parseFloat(cusp);
  if (!Number.isFinite(longitude)) {
    return "";
  }
  const within = ((longitude % 30) + 30) % 30;
  const rounded = Math.round(within * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}°`;
}

/** Within-sign degree ("22.4") -> "22.4°". */
export function formatPlanetDegree(degree: string): string {
  const value = Number.parseFloat(degree);
  if (!Number.isFinite(value)) {
    return degree;
  }
  return `${degree.trim()}°`;
}

const SIGN_SHORT: Record<string, string> = {
  Aries: "Ari",
  Taurus: "Tau",
  Gemini: "Gem",
  Cancer: "Can",
  Leo: "Leo",
  Virgo: "Vir",
  Libra: "Lib",
  Scorpio: "Sco",
  Sagittarius: "Sag",
  Capricorn: "Cap",
  Aquarius: "Aqu",
  Pisces: "Pis",
};

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

export interface SouthIndianOccupant {
  body: string;
  short: string;
  degree: string;
  retrograde: boolean;
  isLagna: boolean;
}

export interface SouthIndianCell {
  sign: string;
  area: string;
  signShort: string;
  house: number | null;
  isLagna: boolean;
  occupants: SouthIndianOccupant[];
}

export interface SouthIndianChart {
  division: number;
  title: string;
  lagnaSign: string;
  lagnaDegree: string;
  cells: SouthIndianCell[];
}

export function bodyShortName(body: string): string {
  return BODY_SHORT[body] ?? body.slice(0, 2);
}

export function signShortName(sign: string): string {
  return SIGN_SHORT[sign] ?? sign.slice(0, 3);
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

/**
 * Sign-fixed South Indian chart: twelve rasi boxes stay in place, lagna
 * and planets sit in the sign they occupy. House numbers are counted
 * from the lagna sign when the division includes house data.
 */
export function buildSouthIndianChart(
  result: ChartResult,
  division: number,
): SouthIndianChart | null {
  const match = result.divisions.find((entry) => entry.division === division);
  if (!match) {
    return null;
  }

  const lagnaHouse = match.houses.find((house) => house.number === 1);
  const lagnaSign = division === 1 ? result.lagna.sign : (lagnaHouse?.sign ?? result.lagna.sign);
  const lagnaDegree =
    division === 1
      ? formatPlanetDegree(result.lagna.degree)
      : formatCuspDegree(lagnaHouse?.cusp ?? "");

  const cells = SOUTH_INDIAN_LAYOUT.map((slot) => {
    const house = match.houses.find((entry) => entry.sign === slot.sign);
    const occupants: SouthIndianOccupant[] = match.placements
      .filter((planet) => planet.sign === slot.sign)
      .sort((a, b) => parseDegreeStart(a.degree) - parseDegreeStart(b.degree))
      .map((planet) => ({
        body: planet.body,
        short: bodyShortName(planet.body),
        degree: formatPlanetDegree(planet.degree),
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

  return {
    division,
    title: divisionTitle(division),
    lagnaSign,
    lagnaDegree,
    cells,
  };
}

/**
 * Sign-fixed South Indian chart of the KP house cusps: twelve rasi boxes
 * stay in place and each house cusp sits in the sign containing it, shown
 * as its house number with the cusp degree. Unequal houses mean a sign can
 * hold several cusps or none.
 */
export function buildKpSouthIndianChart(result: ChartResult): SouthIndianChart | null {
  if (result.kp.cusps.length === 0) {
    return null;
  }
  const first = result.kp.cusps.find((cusp) => cusp.house === 1);
  const lagnaSign = first?.sign ?? "";
  const lagnaDegree = first === undefined ? "" : formatPlanetDegree(first.degree);
  const d1 = result.divisions.find((entry) => entry.division === 1);

  const cells = SOUTH_INDIAN_LAYOUT.map((slot) => {
    const occupants: SouthIndianOccupant[] = [
      ...result.kp.cusps
        .filter((cusp) => cusp.sign === slot.sign)
        .map((cusp) => ({
          order: cusp.degree === "" ? Number.POSITIVE_INFINITY : parseDegreeStart(cusp.degree),
          occupant: {
            body: `House ${cusp.house} cusp`,
            short: `H${cusp.house}`,
            degree: cusp.degree === "" ? "—" : formatPlanetDegree(cusp.degree),
            retrograde: false,
            isLagna: cusp.house === 1,
          },
        })),
      ...(d1?.placements
        .filter((planet) => planet.sign === slot.sign)
        .map((planet) => ({
          order: parseDegreeStart(planet.degree),
          occupant: {
            body: planet.body,
            short: bodyShortName(planet.body),
            degree: formatPlanetDegree(planet.degree),
            retrograde: planet.state === "Retrograde",
            isLagna: false,
          },
        })) ?? []),
    ]
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.occupant);

    return {
      sign: slot.sign,
      area: slot.area,
      signShort: signShortName(slot.sign),
      house: null,
      isLagna: slot.sign === lagnaSign,
      occupants,
    };
  });

  return {
    division: 1,
    title: "KP Cusps",
    lagnaSign,
    lagnaDegree,
    cells,
  };
}

export interface KpCircularCusp {
  house: number;
  sign: string;
  degree: string;
  longitude: number;
}

export interface KpCircularPlanet {
  body: string;
  short: string;
  degree: string;
  longitude: number;
  retrograde: boolean;
}

export interface KpCircularChart {
  ascendant: number;
  lagnaSign: string;
  lagnaDegree: string;
  cusps: KpCircularCusp[];
  planets: KpCircularPlanet[];
}

function absoluteLongitude(sign: string, degree: string): number | null {
  const index = SIGN_ORDER.indexOf(sign);
  const value = Number.parseFloat(degree);
  if (index === -1 || !Number.isFinite(value)) {
    return null;
  }
  return (index * 30 + value + 360) % 360;
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
export function buildKpCircularChart(result: ChartResult): KpCircularChart | null {
  const cusps: KpCircularCusp[] = [];
  for (const cusp of result.kp.cusps) {
    const longitude = absoluteLongitude(cusp.sign, cusp.degree);
    if (longitude === null) {
      continue;
    }
    cusps.push({
      house: cusp.house,
      sign: cusp.sign,
      degree: formatPlanetDegree(cusp.degree),
      longitude,
    });
  }
  if (cusps.length === 0) {
    return null;
  }
  const first = cusps.find((cusp) => cusp.house === 1) ?? cusps[0];
  const d1 = result.divisions.find((entry) => entry.division === 1);
  const planets: KpCircularPlanet[] = [];
  for (const planet of d1?.placements ?? []) {
    const longitude = absoluteLongitude(planet.sign, planet.degree);
    if (longitude === null) {
      continue;
    }
    planets.push({
      body: planet.body,
      short: bodyShortName(planet.body),
      degree: formatPlanetDegree(planet.degree),
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

/**
 * Rows for the sign/house chart: every house 1..12 in order, each with its
 * cusp starting degree and its occupants (RISING first in house 1, then
 * planets by longitude). Empty houses render a single blank row so all 12
 * houses are always visible. Adjacent rows sharing a sign or belonging to
 * the same house merge via signSpan/houseSpan (0 = merged into the row
 * above). The D1 lagna comes from the result; other divisions read house 1.
 */
export function buildHouseChartRows(result: ChartResult, division: number): HouseChartRow[] {
  const match = result.divisions.find((entry) => entry.division === division);

  if (!match) {
    return [];
  }

  const houses = [...match.houses].sort((a, b) => a.number - b.number);

  if (houses.length === 0) {
    return [];
  }

  const lagnaSign =
    division === 1
      ? result.lagna.sign
      : houses.find((house) => house.number === 1)?.sign || result.lagna.sign;

  const baseRows: Omit<HouseChartRow, "signSpan" | "houseSpan">[] = [];

  for (const house of houses) {
    const cusp = formatCuspDegree(house.cusp);
    const cuspSign = house.sign;

    const occupants = match.placements
      .filter((planet) => planet.house === house.number)
      .sort(
        (a, b) =>
          SIGN_ORDER.indexOf(a.sign) * 30 +
          parseDegreeStart(a.degree) -
          (SIGN_ORDER.indexOf(b.sign) * 30 + parseDegreeStart(b.degree)),
      );

    if (house.number === 1) {
      baseRows.push({
        label: "RISING",
        sign: lagnaSign,
        degree: cusp,
        house: house.number,
        cusp,
        cuspSign,
        empty: false,
      });
    }

    if (occupants.length === 0 && house.number !== 1) {
      baseRows.push({
        label: "",
        sign: cuspSign,
        degree: "",
        house: house.number,
        cusp,
        cuspSign,
        empty: true,
      });

      continue;
    }

    /*
     * If the house cusp falls in a different sign from the first
     * occupant, create a dedicated cusp row.
     *
     * Example:
     *
     * 10th cusp = Cancer 27.5°
     * Sun       = Leo 2.1°
     *
     * The cusp must appear on a Cancer row before the Leo planets.
     */
    if (occupants.length > 0 && occupants[0].sign !== cuspSign) {
      baseRows.push({
        label: "",
        sign: cuspSign,
        degree: "",
        house: house.number,
        cusp,
        cuspSign,
        empty: true,
      });
    }

    for (const planet of occupants) {
      baseRows.push({
        label: planet.body,
        sign: planet.sign,
        degree: formatPlanetDegree(planet.degree),
        house: house.number,
        cusp,
        cuspSign,
        empty: false,
      });
    }
  }

  return baseRows.map((row, index) => {
    let signSpan = 0;
    let houseSpan = 0;

    if (index === 0 || baseRows[index - 1].sign !== row.sign) {
      signSpan = 1;

      for (
        let next = index + 1;
        next < baseRows.length && baseRows[next].sign === row.sign;
        next += 1
      ) {
        signSpan += 1;
      }
    }

    if (index === 0 || baseRows[index - 1].house !== row.house) {
      houseSpan = 1;

      for (
        let next = index + 1;
        next < baseRows.length && baseRows[next].house === row.house;
        next += 1
      ) {
        houseSpan += 1;
      }
    }

    return {
      ...row,
      signSpan,
      houseSpan,
    };
  });
}

export function buildChartMarkdown(result: ChartResult): string {
  const lines: string[] = [
    "# Birth Chart",
    "",
    ...(result.birth.name.trim() !== "" ? [`- Name: ${result.birth.name}`] : []),
    `- Place: ${result.birth.place}`,
    `- UTC: ${result.birth.utcIso}`,
    `- Coordinates: ${result.birth.latitude}, ${result.birth.longitude}`,
    `- Ayanamsa: ${result.astroParams.ayanamsa}`,
    `- House system: ${result.astroParams.houseSystem}`,
    `- Lagna: ${result.lagna.sign} ${result.lagna.degree}`,
    "",
    "## Placements",
    "",
    "| Body | Sign | Degree | House | Star | State |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of toPlacementRows(result, 1)) {
    lines.push(
      `| ${row.body} | ${row.sign} | ${row.degree} | ${row.house} | ${row.star}${row.pada === null ? "" : ` ${row.pada}`} | ${row.state} |`,
    );
  }
  lines.push("", "## Vimshottari Dasha", "");
  for (const period of result.dasha.vimshottari) {
    lines.push(`- ${period.mahadasha}: ${period.start} to ${period.end}`);
    for (const antar of period.antardashas) {
      lines.push(`  - ${antar.antardasha}: ${antar.start} to ${antar.end}`);
    }
  }
  lines.push("", "## Chara Dasha", "");
  for (const period of result.dasha.chara) {
    lines.push(`- ${period.mahadasha}: ${period.start} to ${period.end}`);
    for (const antar of period.antardashas) {
      lines.push(`  - ${antar.antardasha}: ${antar.start} to ${antar.end}`);
    }
  }
  lines.push("", "## Sthira Dasha", "");
  for (const period of result.dasha.sthira) {
    lines.push(`- ${period.mahadasha}: ${period.start} to ${period.end}`);
    for (const antar of period.antardashas) {
      lines.push(`  - ${antar.antardasha}: ${antar.start} to ${antar.end}`);
    }
  }
  for (const division of result.divisions) {
    if (division.division === 1) {
      continue;
    }
    lines.push("", `## D${division.division} placements`, "");
    lines.push("| Body | Sign | Degree | House | State |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const row of toPlacementRows(result, division.division)) {
      if (row.body === "Lagna") {
        continue;
      }
      lines.push(`| ${row.body} | ${row.sign} | ${row.degree} | ${row.house} | ${row.state} |`);
    }
    lines.push("", `## D${division.division} houses`, "");
    for (const house of division.houses) {
      lines.push(
        `- House ${house.number}: ${house.sign}, cusp ${house.cusp || "unknown"}, lord ${house.lord || "unknown"}, occupants ${house.occupants.join(", ") || "none"}`,
      );
    }
  }
  lines.push("", "## Jaimini", "");
  for (const karaka of result.jaimini.karakas) {
    lines.push(`- ${karaka.role}: ${karaka.planet}`);
  }
  lines.push(`- Karakamsha: ${result.jaimini.karakamsha}`);
  lines.push(`- Upapada: ${result.jaimini.upapada}`);
  for (const entry of result.jaimini.arudha) {
    lines.push(`- Arudha Pada ${entry.house}: ${entry.pada}`);
  }
  lines.push(`- Rashi Drishti on Lagna: ${result.jaimini.drishti.join(", ")}`);
  lines.push(`- Supporting Argala: ${result.jaimini.argala.supporting.join(", ")}`);
  lines.push(`- Obstructing Argala: ${result.jaimini.argala.obstructing.join(", ")}`);
  lines.push("", "## Sarvashtakavarga", "");
  if (result.sav.rows.length > 0) {
    const signHeads = result.sav.signs.map((sign) => signShortName(sign)).join(" | ");
    lines.push(`| Planet | ${signHeads} | Total |`);
    lines.push(`| --- | ${result.sav.signs.map(() => "---").join(" | ")} | --- |`);
    for (const row of result.sav.rows) {
      lines.push(`| ${row.planet} | ${row.points.join(" | ")} | ${row.total} |`);
    }
    lines.push(`| Total | ${result.sav.signTotals.join(" | ")} | ${result.sav.total} |`);
  }
  lines.push("", "## KP Chart", "");
  lines.push(`- Ayanamsa: ${result.kp.astroParams.ayanamsa}`);
  lines.push(`- House system: ${result.kp.astroParams.houseSystem}`);
  lines.push("");
  lines.push("| Body | Sign Lord | Star Lord | Sub Lord | Signifying Houses |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const row of result.kp.rows) {
    lines.push(
      `| ${row.name} | ${row.signLord} | ${row.starLord} | ${row.subLord} | ${formatSignifyingHouses(row.signifyingHouses)} |`,
    );
  }
  lines.push("", "### KP House Cusps", "");
  lines.push("| House | Sign | Cusp | Sign Lord | Star Lord | Sub Lord | Sub-Sub Lord |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const cusp of result.kp.cusps ?? []) {
    lines.push(
      `| ${cusp.house} | ${cusp.sign} | ${cusp.degree} | ${cusp.signLord} | ${cusp.starLord} | ${cusp.subLord} | ${cusp.subSubLord} |`,
    );
  }
  lines.push(
    "",
    "This chart is interpretive guidance, not certainty or a substitute for medical, legal, or financial advice.",
  );
  return lines.join("\n");
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "1987-05-26T17:41:00.000Z" -> "26 May 1987" (UTC, no time of day). */
export function formatDashaDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function pluralize(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`;
}

/** Calendar-aware span like "10 yrs", "1 yr 4 mos", "18 days". */
export function formatDashaDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0 || (years === 0 && months === 0 && days <= 0)) {
    return "";
  }
  const parts: string[] = [];
  if (years > 0) {
    parts.push(pluralize(years, "yr", "yrs"));
  }
  if (months > 0) {
    parts.push(pluralize(months, "mo", "mos"));
  }
  if (days > 0 && years === 0) {
    parts.push(pluralize(days, "day", "days"));
  }
  return parts.slice(0, 2).join(" ");
}

/** Index of the period covering now, or -1. */
export function findCurrentPeriodIndex(
  periods: { start: string; end: string }[],
  nowIso: string = new Date().toISOString(),
): number {
  const now = new Date(nowIso).getTime();
  if (!Number.isFinite(now)) {
    return -1;
  }
  return periods.findIndex((period) => {
    const start = new Date(period.start).getTime();
    const end = new Date(period.end).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end;
  });
}

function markdownTable(headers: string[], rows: readonly (readonly string[])[]): string {
  const escape = (value: string) => value.replaceAll("|", "\\|");
  const line = (cells: readonly string[]) => `| ${cells.map(escape).join(" | ")} |`;
  return [
    line(headers),
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => line(row)),
  ].join("\n");
}

function divisionChartMarkdown(result: ChartResult, division: number): string {
  const match = result.divisions.find((entry) => entry.division === division);
  if (!match) {
    return "_Not available._";
  }
  const lagnaHouse = match.houses.find((house) => house.number === 1);
  const lagna =
    division === 1
      ? { sign: result.lagna.sign, degree: result.lagna.degree }
      : {
          sign: lagnaHouse?.sign ?? "",
          degree: lagnaHouse ? formatCuspDegree(lagnaHouse.cusp) : "",
        };
  return markdownTable(
    ["Body", "Sign", "Degree", "House"],
    [
      ["Lagna", lagna.sign, lagna.degree, "1"],
      ...match.placements.map((placement) => [
        placement.state === "Retrograde" ? `${placement.body} (r)` : placement.body,
        placement.sign,
        placement.degree,
        String(placement.house),
      ]),
    ],
  );
}

function mahadashaMarkdownTable(periods: readonly ChartDashaPeriod[]): string {
  return markdownTable(
    ["Mahadasha", "Start", "End", "Duration"],
    periods.map((period) => [
      period.mahadasha,
      formatDashaDate(period.start),
      formatDashaDate(period.end),
      formatDashaDuration(period.start, period.end),
    ]),
  );
}

function antardashaMarkdownTable(period: ChartDashaPeriod): string {
  if (period.antardashas.length === 0) {
    return "_No antardasha periods._";
  }
  return markdownTable(
    ["Antardasha", "Start", "End", "Duration"],
    period.antardashas.map((antar) => [
      antar.antardasha,
      formatDashaDate(antar.start),
      formatDashaDate(antar.end),
      formatDashaDuration(antar.start, antar.end),
    ]),
  );
}

export function buildChatGptPromptUrl(result: ChartResult): string {
  const currentIndex = findCurrentPeriodIndex(result.dasha.vimshottari);
  const currentMahadasha = currentIndex === -1 ? undefined : result.dasha.vimshottari[currentIndex];
  const cuspSpans = result.kp.cusps
    .flatMap((cusp) => {
      const longitude = absoluteLongitude(cusp.sign, cusp.degree);
      return longitude === null ? [] : [{ house: cusp.house, longitude }];
    })
    .sort((a, b) => a.longitude - b.longitude);
  // KP house of a planet: the cusp span containing its sidereal longitude.
  const houseOf = (body: string): string => {
    const placement = (
      result.divisions.find((entry) => entry.division === 1)?.placements ?? []
    ).find((entry) => entry.body === body);
    const longitude =
      placement === undefined ? null : absoluteLongitude(placement.sign, placement.degree);
    if (longitude === null || cuspSpans.length === 0) {
      return "—";
    }
    for (let i = 0; i < cuspSpans.length; i += 1) {
      const current = cuspSpans[i];
      const next = cuspSpans[(i + 1) % cuspSpans.length];
      if (current === undefined || next === undefined) {
        continue;
      }
      const span = (((next.longitude - current.longitude) % 360) + 360) % 360 || 360;
      const pos = (((longitude - current.longitude) % 360) + 360) % 360;
      if (pos < span) {
        return String(current.house);
      }
    }
    return "—";
  };
  const prompt = [
    "Read the skill here: https://raw.githubusercontent.com/astro-ascendant/skills/refs/heads/main/skills/ascendant/SKILL.md",
    "https://github.com/astro-ascendant/skills/tree/main/skills/ascendant/references",
    "",
    ...(result.birth.name.trim() !== "" ? [`Name: ${result.birth.name}`, ""] : []),
    "#D1",
    divisionChartMarkdown(result, 1),
    "",
    "#D9",
    divisionChartMarkdown(result, 9),
    "",
    "#KP",
    markdownTable(
      ["Body", "House", "Sign Lord", "Star Lord", "Sub Lord", "Signifying Houses"],
      result.kp.rows.map((row) => [
        row.name,
        houseOf(row.name),
        row.signLord,
        row.starLord,
        row.subLord,
        formatSignifyingHouses(row.signifyingHouses),
      ]),
    ),
    "",
    "#KP Cusps",
    markdownTable(
      ["House", "Sign", "Cusp", "Sign Lord", "Star Lord", "Sub Lord", "Sub-Sub Lord"],
      (result.kp.cusps ?? []).map((cusp) => [
        String(cusp.house),
        cusp.sign,
        cusp.degree,
        cusp.signLord,
        cusp.starLord,
        cusp.subLord,
        cusp.subSubLord,
      ]),
    ),
    "",
    "#Vimshottari",
    mahadashaMarkdownTable(result.dasha.vimshottari),
    "",
    "#Antardasha",
    currentMahadasha ? antardashaMarkdownTable(currentMahadasha) : "_No current antardasha._",
  ].join("\n");
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}
