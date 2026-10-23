import type { ChartResult } from "@/lib/chart";

export type ChartStatus = "empty" | "calculating" | "failure" | "success";

export interface ChartSessionState {
  readonly status: ChartStatus;
  readonly result: ChartResult | null;
  readonly errors: readonly string[];
}

export type ChartSessionEvent =
  | { readonly type: "start" }
  | { readonly type: "succeed"; readonly result: ChartResult }
  | { readonly type: "fail"; readonly errors: readonly string[] }
  | { readonly type: "reset" };

export const initialChartSessionState: ChartSessionState = {
  status: "empty",
  result: null,
  errors: [],
};

/**
 * Session transitions. `start` deliberately keeps the previous result: the
 * report header reads that snapshot until a new result replaces it.
 */
export function reduceChartSession(
  state: ChartSessionState,
  event: ChartSessionEvent,
): ChartSessionState {
  switch (event.type) {
    case "start":
      return { ...state, status: "calculating", errors: [] };
    case "succeed":
      return { status: "success", result: event.result, errors: [] };
    case "fail":
      return { status: "failure", result: null, errors: event.errors };
    case "reset":
      return initialChartSessionState;
  }
}
