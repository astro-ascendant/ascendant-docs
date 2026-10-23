import { describe, expect, test } from "bun:test";
import type { ChartDashaPeriod, ChartDivision, ChartHouse, ChartResult } from "./chart";
import { buildDivisionView, buildHeadlineView, buildKpWheelView } from "./chart-view";

const lagna = { sign: "Libra", longitude: 180.2336489637064, house: 1 };

function house(number: number, sign: string, cusp: number, occupants: string[] = []): ChartHouse {
  return { number, sign, cusp, lord: "", occupants, significators: [] };
}

function cusp(
  houseNumber: number,
  sign: string,
  longitude: number | null,
): ChartResult["kp"]["cusps"][number] {
  return {
    house: houseNumber,
    sign,
    longitude,
    signLord: "",
    starLord: "",
    subLord: "",
    subSubLord: "",
  };
}

const d1: ChartDivision = {
  division: 1,
  houses: [house(1, "Libra", 180, ["Saturn", "Venus"]), house(10, "Cancer", 90, ["Moon"])],
  placements: [
    {
      body: "Saturn",
      sign: "Libra",
      longitude: 184.5,
      house: 1,
      star: "Chitra",
      pada: 3,
      state: "Retrograde",
    },
    {
      body: "Venus",
      sign: "Libra",
      longitude: 182,
      house: 1,
      star: "Swati",
      pada: 1,
      state: "",
    },
    {
      body: "Moon",
      sign: "Cancer",
      longitude: 103.14,
      house: 10,
      star: "Pushya",
      pada: 2,
      state: "",
    },
  ],
};

const d9: ChartDivision = {
  division: 9,
  houses: [house(1, "Taurus", 31.5)],
  placements: [
    {
      body: "Moon",
      sign: "Taurus",
      longitude: 34,
      house: 1,
      star: "",
      pada: null,
      state: "",
    },
  ],
};

const kp: ChartResult["kp"] = {
  astroParams: { ayanamsa: "KrishnamurtiVP291", houseSystem: "Placidus" },
  rows: [],
  cusps: [
    cusp(1, "Libra", 180.31037646462585),
    cusp(2, "Libra", 209.23647056218567),
    cusp(8, "Aries", null),
  ],
  dasha: { vimshottari: [] },
};

const periods: ChartDashaPeriod[] = [
  {
    mahadasha: "Saturn",
    start: "2020-01-01T00:00:00.000Z",
    end: "2039-01-01T00:00:00.000Z",
    antardashas: [],
  },
  {
    mahadasha: "Mercury",
    start: "2039-01-01T00:00:00.000Z",
    end: "2056-01-01T00:00:00.000Z",
    antardashas: [],
  },
];

describe("buildDivisionView", () => {
  test("puts the lagna first and sorts D1 occupants by longitude", () => {
    const view = buildDivisionView({ lagna, division: d1 });
    const libra = view.cells.find((cell) => cell.sign === "Libra");

    expect(view.title).toBe("Rashi");
    expect(view.lagnaSign).toBe("Libra");
    expect(view.lagnaDegree).toBe("0°14'");
    expect(libra?.house).toBe(1);
    expect(libra?.isLagna).toBe(true);
    expect(libra?.occupants.map((occupant) => occupant.body)).toEqual(["Lagna", "Venus", "Saturn"]);
    expect(libra?.occupants[2]).toMatchObject({
      short: "Sa",
      degree: "4°30'",
      retrograde: true,
    });
    expect(view.label).toContain("Lagna Libra 0°14'");
  });

  test("reads the lagna sign and cusp from house 1 in a divisional chart", () => {
    const view = buildDivisionView({ lagna, division: d9 });
    const taurus = view.cells.find((cell) => cell.sign === "Taurus");

    expect(view.title).toBe("Navamsha");
    expect(view.lagnaSign).toBe("Taurus");
    expect(view.lagnaDegree).toBe("1°30'");
    expect(taurus?.occupants[0]).toMatchObject({ body: "Lagna", degree: "1°30'" });
    expect(taurus?.occupants[1]).toMatchObject({ body: "Moon", degree: "4°00'" });
  });
});

describe("buildKpWheelView", () => {
  test("keeps the ascendant, cusps, and D1 planets", () => {
    const view = buildKpWheelView({ kp, d1 });

    expect(view?.cusps).toHaveLength(2);
    expect(view?.ascendant).toBeCloseTo(180.3104, 3);
    expect(view?.lagnaSign).toBe("Libra");
    expect(view?.lagnaDegree).toBe("0°19'");
    expect(view?.planets.map((planet) => planet.body)).toEqual(["Saturn", "Venus", "Moon"]);
    expect(view?.planets[0]).toMatchObject({ short: "Sa", degree: "4°30'", retrograde: true });
  });

  test("returns null when no cusp has a longitude", () => {
    const nullOnly = { ...kp, cusps: [cusp(8, "Aries", null)] };

    expect(buildKpWheelView({ kp: nullOnly, d1 })).toBeNull();
  });

  test("keeps the wheel when D1 is absent", () => {
    const view = buildKpWheelView({ kp, d1: undefined });

    expect(view?.planets).toEqual([]);
    expect(view?.cusps).toHaveLength(2);
  });
});

describe("buildHeadlineView", () => {
  test("derives the ascendant, Moon, star, and current mahadasha", () => {
    const facts = buildHeadlineView(
      { lagna, d1, vimshottari: periods },
      "2030-06-01T00:00:00.000Z",
    );

    expect(facts).toEqual({
      ascendant: "Libra 0°14'",
      moon: "Cancer 13°08'",
      star: "Pushya · Pada 2",
      mahadasha: "Saturn",
    });
  });

  test("falls back to dashes when the Moon or dasha is missing", () => {
    const facts = buildHeadlineView(
      { lagna, d1: { ...d1, placements: [] }, vimshottari: periods },
      "2019-06-01T00:00:00.000Z",
    );

    expect(facts).toEqual({
      ascendant: "Libra 0°14'",
      moon: "—",
      star: "—",
      mahadasha: "—",
    });
  });
});
