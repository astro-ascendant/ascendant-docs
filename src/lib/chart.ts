import { formatLongitude } from "./longitude";

export interface ChartBirthInput {
  name: string;
  date: string;
  time: string;
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

export function validateChartInput(
  input: ChartBirthInput,
): ChartInputValidation {
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
  } else if (
    !isFiniteLatitude(input.latitude) ||
    !isFiniteLongitude(input.longitude)
  ) {
    fields.place = "Choose a birth place from the suggestions.";
  }
  return { ok: Object.keys(fields).length === 0, fields };
}

export const ALL_DIVISIONS = [
  1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60,
] as const;

export interface ChartPlacement {
  body: string;
  sign: string;
  longitude: number | null;
  house: number;
  star: string;
  pada: number | null;
  state: string;
}

export interface ChartHouse {
  number: number;
  sign: string;
  cusp: number | null;
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
  longitude: number | null;
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
  /** Vimshottari periods from the KP calculation's own Moon position. */
  dasha: {
    vimshottari: ChartDashaPeriod[];
  };
}

export interface ChartResult {
  birth: {
    name: string;
    utcIso: string;
    /** Wall-clock birth date as entered, YYYY-MM-DD. */
    date: string;
    /** Wall-clock birth time as entered, HH:MM(:SS). */
    time: string;
    /** IANA zone resolved from the birth coordinates, when known. */
    timeZone: string | null;
    /** Verbatim offset the instant was built from, e.g. "+03:00", when known. */
    utcOffset: string | null;
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
    longitude: number | null;
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
export function uniqueHousesInOrder(
  groups: readonly (readonly number[])[],
): number[] {
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

export function toPlacementRows(
  result: ChartResult,
  division: number,
): ChartPlacement[] {
  const match = result.divisions.find((entry) => entry.division === division);
  if (!match) {
    return [];
  }
  return [
    {
      body: "Lagna",
      sign: result.lagna.sign,
      longitude: result.lagna.longitude,
      house: result.lagna.house,
      star: "",
      pada: null,
      state: "",
    },
    ...match.placements,
  ];
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

/** Short rasi label used by the text summaries. */
export function signShortName(sign: string): string {
  return SIGN_SHORT[sign] ?? sign.slice(0, 3);
}

export function buildChartMarkdown(result: ChartResult): string {
  const offset =
    result.birth.utcOffset === null
      ? ""
      : ` (UTC${result.birth.utcOffset}${
          result.birth.timeZone === null ? "" : `, ${result.birth.timeZone}`
        })`;
  const lines: string[] = [
    "# Horoscope",
    "",
    ...(result.birth.name.trim() !== ""
      ? [`- Name: ${result.birth.name}`]
      : []),
    ...(result.birth.date === ""
      ? []
      : [`- Birth: ${result.birth.date} ${result.birth.time}`]),
    `- Place: ${result.birth.place}`,
    `- UTC: ${result.birth.utcIso}${offset}`,
    `- Coordinates: ${result.birth.latitude}, ${result.birth.longitude}`,
    `- Ayanamsa: ${result.astroParams.ayanamsa}`,
    `- House system: ${result.astroParams.houseSystem}`,
    `- Lagna: ${result.lagna.sign} ${formatLongitude(result.lagna.longitude)}`,
    "",
    "## Placements",
    "",
    "| Body | Sign | Degree | House | Star | State |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of toPlacementRows(result, 1)) {
    lines.push(
      `| ${row.body} | ${row.sign} | ${formatLongitude(row.longitude)} | ${row.house} | ${row.star}${row.pada === null ? "" : ` ${row.pada}`} | ${row.state} |`,
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
      lines.push(
        `| ${row.body} | ${row.sign} | ${formatLongitude(row.longitude)} | ${row.house} | ${row.state} |`,
      );
    }
    lines.push("", `## D${division.division} houses`, "");
    for (const house of division.houses) {
      lines.push(
        `- House ${house.number}: ${house.sign}, cusp ${house.cusp === null ? "unknown" : formatLongitude(house.cusp)}, lord ${house.lord || "unknown"}, occupants ${house.occupants.join(", ") || "none"}`,
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
  lines.push(
    `- Supporting Argala: ${result.jaimini.argala.supporting.join(", ")}`,
  );
  lines.push(
    `- Obstructing Argala: ${result.jaimini.argala.obstructing.join(", ")}`,
  );
  lines.push("", "## Sarvashtakavarga", "");
  if (result.sav.rows.length > 0) {
    const signHeads = result.sav.signs
      .map((sign) => signShortName(sign))
      .join(" | ");
    lines.push(`| Planet | ${signHeads} | Total |`);
    lines.push(
      `| --- | ${result.sav.signs.map(() => "---").join(" | ")} | --- |`,
    );
    for (const row of result.sav.rows) {
      lines.push(
        `| ${row.planet} | ${row.points.join(" | ")} | ${row.total} |`,
      );
    }
    lines.push(
      `| Total | ${result.sav.signTotals.join(" | ")} | ${result.sav.total} |`,
    );
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
  lines.push(
    "| House | Sign | Cusp | Sign Lord | Star Lord | Sub Lord | Sub-Sub Lord |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const cusp of result.kp.cusps ?? []) {
    lines.push(
      `| ${cusp.house} | ${cusp.sign} | ${formatLongitude(cusp.longitude)} | ${cusp.signLord} | ${cusp.starLord} | ${cusp.subLord} | ${cusp.subSubLord} |`,
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

/** Calendar-aware span like "10Y", "1Y 4M", "1Y 4M 12D", "18D". */
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
    const prevMonth = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0),
    );
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
    parts.push(`${years}Y`);
  }
  if (months > 0) {
    parts.push(`${months}M`);
  }
  if (days > 0) {
    parts.push(`${days}D`);
  }
  return parts.join(" ");
}

/** Index of the period covering now, or -1. */
export function findCurrentPeriodIndex(
  periods: readonly { start: string; end: string }[],
  nowIso: string = new Date().toISOString(),
): number {
  const now = new Date(nowIso).getTime();
  if (!Number.isFinite(now)) {
    return -1;
  }
  return periods.findIndex((period) => {
    const start = new Date(period.start).getTime();
    const end = new Date(period.end).getTime();
    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      now < end
    );
  });
}

function markdownTable(
  headers: string[],
  rows: readonly (readonly string[])[],
): string {
  const escape = (value: string) => value.replaceAll("|", "\\|");
  const line = (cells: readonly string[]) =>
    `| ${cells.map(escape).join(" | ")} |`;
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
      ? {
          sign: result.lagna.sign,
          degree: formatLongitude(result.lagna.longitude),
        }
      : {
          sign: lagnaHouse?.sign ?? "",
          degree: formatLongitude(lagnaHouse?.cusp),
        };
  return markdownTable(
    ["Body", "Sign", "Degree", "House"],
    [
      ["Lagna", lagna.sign, lagna.degree, "1"],
      ...match.placements.map((placement) => [
        placement.state === "Retrograde"
          ? `${placement.body} (r)`
          : placement.body,
        placement.sign,
        formatLongitude(placement.longitude),
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

export function buildChartPrompt(result: ChartResult): string {
  const currentIndex = findCurrentPeriodIndex(result.dasha.vimshottari);
  const currentMahadasha =
    currentIndex === -1 ? undefined : result.dasha.vimshottari[currentIndex];
  const cuspSpans = result.kp.cusps
    .flatMap((cusp) => {
      const longitude = cusp.longitude;
      return longitude === null ? [] : [{ house: cusp.house, longitude }];
    })
    .sort((a, b) => a.longitude - b.longitude);
  // KP house of a planet: the cusp span containing its sidereal longitude.
  const houseOf = (body: string): string => {
    const placement = (
      result.divisions.find((entry) => entry.division === 1)?.placements ?? []
    ).find((entry) => entry.body === body);
    const longitude = placement?.longitude ?? null;
    if (longitude === null || cuspSpans.length === 0) {
      return "—";
    }
    for (let i = 0; i < cuspSpans.length; i += 1) {
      const current = cuspSpans[i];
      const next = cuspSpans[(i + 1) % cuspSpans.length];
      if (current === undefined || next === undefined) {
        continue;
      }
      const span =
        (((next.longitude - current.longitude) % 360) + 360) % 360 || 360;
      const pos = (((longitude - current.longitude) % 360) + 360) % 360;
      if (pos < span) {
        return String(current.house);
      }
    }
    return "—";
  };
  return [
    "Read the skill here: https://raw.githubusercontent.com/astro-ascendant/skills/refs/heads/main/skills/ascendant/SKILL.md",
    "https://github.com/astro-ascendant/skills/tree/main/skills/ascendant/references",
    "",
    ...(result.birth.name.trim() !== ""
      ? [`Name: ${result.birth.name}`, ""]
      : []),
    "#D1",
    divisionChartMarkdown(result, 1),
    "",
    "#D9",
    divisionChartMarkdown(result, 9),
    "",
    "#KP",
    markdownTable(
      [
        "Body",
        "House",
        "Sign Lord",
        "Star Lord",
        "Sub Lord",
        "Signifying Houses",
      ],
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
      [
        "House",
        "Sign",
        "Cusp",
        "Sign Lord",
        "Star Lord",
        "Sub Lord",
        "Sub-Sub Lord",
      ],
      (result.kp.cusps ?? []).map((cusp) => [
        String(cusp.house),
        cusp.sign,
        formatLongitude(cusp.longitude),
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
    currentMahadasha
      ? antardashaMarkdownTable(currentMahadasha)
      : "_No current antardasha._",
  ].join("\n");
}

export type ChartPromptProvider = "chatgpt" | "claude" | "gemini";

export function buildChartPromptUrl(
  result: ChartResult,
  provider: ChartPromptProvider = "chatgpt",
): string {
  const prompt = encodeURIComponent(buildChartPrompt(result));
  switch (provider) {
    case "claude":
      return `https://claude.ai/new?q=${prompt}`;
    case "gemini":
      // The Gemini app has no prompt parameter; AI Studio does.
      return `https://aistudio.google.com/prompts/new_chat?prompt=${prompt}`;
    default:
      return `https://chatgpt.com/?q=${prompt}`;
  }
}
