import { describe, expect, test } from "bun:test";
import { degreeInSign, formatLongitude, normalizeLongitude, signOf } from "./longitude";

describe("normalizeLongitude", () => {
  test("wraps into [0, 360)", () => {
    expect(normalizeLongitude(0)).toBe(0);
    expect(normalizeLongitude(360)).toBe(0);
    expect(normalizeLongitude(-1)).toBe(359);
    expect(normalizeLongitude(725)).toBe(5);
  });
});

describe("signOf", () => {
  test("maps boundaries to the starting sign", () => {
    expect(signOf(0)).toBe("Aries");
    expect(signOf(29.999)).toBe("Aries");
    expect(signOf(30)).toBe("Taurus");
    expect(signOf(359.999)).toBe("Pisces");
    expect(signOf(-1)).toBe("Pisces");
  });
});

describe("degreeInSign", () => {
  test("keeps the within-sign degree", () => {
    expect(degreeInSign(30)).toBe(0);
    expect(degreeInSign(179.5)).toBeCloseTo(29.5);
  });
});

describe("formatLongitude", () => {
  test("rounds to arcminutes", () => {
    expect(formatLongitude(0)).toBe("0°00'");
    expect(formatLongitude(1.85)).toBe("1°51'");
  });

  test("clamps a boundary that would round to thirty degrees", () => {
    expect(formatLongitude(29.99999)).toBe("29°59'");
    expect(formatLongitude(359.99999)).toBe("29°59'");
  });

  test("crosses into the next sign only at an exact boundary", () => {
    expect(formatLongitude(30)).toBe("0°00'");
  });

  test("normalizes negative longitudes", () => {
    expect(formatLongitude(-1)).toBe("29°00'");
  });

  test("renders a missing longitude as an empty string", () => {
    expect(formatLongitude(null)).toBe("");
    expect(formatLongitude(undefined)).toBe("");
    expect(formatLongitude(Number.NaN)).toBe("");
  });
});
