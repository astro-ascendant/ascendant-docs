import { describe, expect, test } from "bun:test";
import type { Chart } from "astro-ascendant";
import { DateTime } from "effect";
import { signOf } from "../lib/longitude";
import fixture from "./__fixtures__/manama.json";
import { toChartResult, type ChartMappingOptional } from "./chart-mapping";

const calculation = fixture.calculation as unknown as Chart.ChartCalculation;
const kpCalculation = fixture.kp as unknown as Chart.ChartCalculation;

const birth = {
  name: "Manama",
  utcIso: "2002-01-28T19:54:00.000Z",
  date: "2002-01-28",
  time: "22:54",
  timeZone: "Asia/Qatar",
  utcOffset: "+03:00",
  place: "Manama, Bahrain",
  latitude: 26.2285,
  longitude: 50.586,
};

const emptyOptional: ChartMappingOptional = {
  vimshottari: null,
  kpVimshottari: null,
  chara: null,
  sthira: null,
  sav: null,
  karakas: null,
  karakamsha: null,
  upapada: null,
  drishti: null,
  argala: null,
  arudha: [],
};

const emptyJaimini = {
  karakas: [],
  karakamsha: "",
  upapada: "",
  arudha: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, pada: "" })),
  drishti: [],
  argala: { supporting: [], obstructing: [] },
};

describe("toChartResult", () => {
  test("maps the lagna and method from the D1 calculation", () => {
    const result = toChartResult({
      calculation,
      kpCalculation,
      birth,
      optional: emptyOptional,
    });

    expect(result.lagna.sign).toBe("Libra");
    expect(result.lagna.longitude).toBeCloseTo(180.2336, 3);
    expect(result.astroParams).toEqual({ ayanamsa: "Lahiri", houseSystem: "WholeSign" });
  });

  test("keeps absolute longitudes consistent with their signs across divisions", () => {
    const result = toChartResult({
      calculation,
      kpCalculation,
      birth,
      optional: emptyOptional,
    });

    expect(result.divisions.map((division) => division.division)).toEqual([1, 9]);
    for (const division of result.divisions) {
      for (const placement of division.placements) {
        expect(placement.longitude).not.toBeNull();
        if (placement.longitude !== null) {
          expect(placement.sign).toBe(signOf(placement.longitude));
        }
      }
    }
  });

  test("maps KP rows and cusps, including two cusps in one sign", () => {
    const result = toChartResult({
      calculation,
      kpCalculation,
      birth,
      optional: emptyOptional,
    });

    expect(result.kp.astroParams).toEqual({
      ayanamsa: "KrishnamurtiVP291",
      houseSystem: "Placidus",
    });
    expect(result.kp.rows).toHaveLength(10);
    expect(
      result.kp.cusps.filter((cusp) => cusp.sign === "Libra").map((cusp) => cusp.house),
    ).toEqual([1, 2]);
    expect(result.kp.cusps.find((cusp) => cusp.house === 8)?.longitude).toBeCloseTo(29.2365, 3);
  });

  test("keeps a missing KP cusp null without losing its sign", () => {
    const withoutCusp = structuredClone(kpCalculation);
    const houses = withoutCusp.charts[0].houses as unknown as Record<number, { cusp?: number }>;
    delete houses[8].cusp;

    const result = toChartResult({
      calculation,
      kpCalculation: withoutCusp,
      birth,
      optional: emptyOptional,
    });

    expect(result.kp.cusps.find((cusp) => cusp.house === 8)).toMatchObject({
      house: 8,
      sign: "Aries",
      longitude: null,
    });
  });

  test("falls back to empty optional sections", () => {
    const result = toChartResult({
      calculation,
      kpCalculation,
      birth,
      optional: emptyOptional,
    });

    expect(result.dasha).toEqual({ vimshottari: [], chara: [], sthira: [] });
    expect(result.kp.dasha.vimshottari).toEqual([]);
    expect(result.jaimini).toEqual(emptyJaimini);
    expect(result.sav).toEqual({
      signs: [
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
      ],
      rows: [],
      signTotals: [],
      total: 0,
    });
  });

  test("formats dasha periods from their instants", () => {
    const start = DateTime.fromDateUnsafe(new Date("2000-01-01T00:00:00.000Z"));
    const end = DateTime.fromDateUnsafe(new Date("2001-01-01T00:00:00.000Z"));
    const vimshottari: NonNullable<ChartMappingOptional["vimshottari"]> = [
      {
        mahadasha: "Ketu",
        start,
        end,
        antardashas: [{ mahadasha: "Ketu", antardasha: "Venus", start, end }],
      },
    ];

    const result = toChartResult({
      calculation,
      kpCalculation,
      birth,
      optional: { ...emptyOptional, vimshottari },
    });

    expect(result.dasha.vimshottari).toEqual([
      {
        mahadasha: "Ketu",
        start: "2000-01-01T00:00:00.000Z",
        end: "2001-01-01T00:00:00.000Z",
        antardashas: [
          {
            antardasha: "Venus",
            start: "2000-01-01T00:00:00.000Z",
            end: "2001-01-01T00:00:00.000Z",
          },
        ],
      },
    ]);
  });
});
