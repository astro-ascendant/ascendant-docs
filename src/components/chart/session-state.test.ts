import { describe, expect, test } from "bun:test";
import type { ChartResult } from "@/lib/chart";
import {
  initialChartSessionState,
  reduceChartSession,
  type ChartSessionState,
} from "./session-state";

const result: ChartResult = {
  birth: {
    name: "Test",
    utcIso: "2000-01-01T00:00:00.000Z",
    date: "2000-01-01",
    time: "00:00",
    timeZone: null,
    utcOffset: "+00:00",
    place: "Test",
    latitude: 0,
    longitude: 0,
  },
  astroParams: { ayanamsa: "Lahiri", houseSystem: "WholeSign" },
  lagna: { sign: "Aries", longitude: 0, house: 1 },
  kp: {
    astroParams: { ayanamsa: "KrishnamurtiVP291", houseSystem: "Placidus" },
    rows: [],
    cusps: [],
    dasha: { vimshottari: [] },
  },
  divisions: [],
  dasha: { vimshottari: [], chara: [], sthira: [] },
  jaimini: {
    karakas: [],
    karakamsha: "",
    upapada: "",
    arudha: [],
    drishti: [],
    argala: { supporting: [], obstructing: [] },
  },
  sav: { signs: [], rows: [], signTotals: [], total: 0 },
};

describe("reduceChartSession", () => {
  test("start keeps the previous result and clears errors", () => {
    const succeeded = reduceChartSession(initialChartSessionState, { type: "succeed", result });
    const failed = reduceChartSession(succeeded, { type: "fail", errors: ["network"] });
    const started = reduceChartSession(failed, { type: "start" });

    expect(started).toEqual({ status: "calculating", result: null, errors: [] });
  });

  test("start keeps a result that is still on screen", () => {
    const succeeded = reduceChartSession(initialChartSessionState, { type: "succeed", result });
    const started = reduceChartSession(succeeded, { type: "start" });

    expect(started.status).toBe("calculating");
    expect(started.result).toBe(result);
    expect(started.errors).toEqual([]);
  });

  test("succeed replaces the result and clears errors", () => {
    const failed: ChartSessionState = { status: "failure", result: null, errors: ["network"] };
    const next = reduceChartSession(failed, { type: "succeed", result });

    expect(next).toEqual({ status: "success", result, errors: [] });
  });

  test("fail clears the result and keeps the message", () => {
    const succeeded = reduceChartSession(initialChartSessionState, { type: "succeed", result });
    const next = reduceChartSession(succeeded, { type: "fail", errors: ["network"] });

    expect(next).toEqual({ status: "failure", result: null, errors: ["network"] });
  });

  test("reset returns the empty state", () => {
    const succeeded = reduceChartSession(initialChartSessionState, { type: "succeed", result });

    expect(reduceChartSession(succeeded, { type: "reset" })).toBe(initialChartSessionState);
  });
});
