import type { ChartBirthInput, ChartResult } from "@/lib/chart";
import type { ChartFailure } from "@/lib/chart-errors";

export type ChartStatus = "empty" | "calculating" | "failure" | "success";

export interface ChartSessionState {
  readonly status: ChartStatus;
  readonly result: ChartResult | null;
  /**
   * What the reader asked for. Kept through a failure so the report header
   * still names the chart that did not cast, and the editor stays reachable.
   */
  readonly attempt: ChartBirthInput | null;
  readonly failure: ChartFailure | null;
}

export type ChartSessionEvent =
  | { readonly type: "start"; readonly birth: ChartBirthInput }
  | { readonly type: "succeed"; readonly result: ChartResult }
  | { readonly type: "fail"; readonly failure: ChartFailure }
  | { readonly type: "reset" };

export const initialChartSessionState: ChartSessionState = {
  status: "empty",
  result: null,
  attempt: null,
  failure: null,
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
      return {
        ...state,
        status: "calculating",
        attempt: event.birth,
        failure: null,
      };
    case "succeed":
      return {
        status: "success",
        result: event.result,
        attempt: state.attempt,
        failure: null,
      };
    case "fail":
      return {
        ...state,
        status: "failure",
        result: null,
        failure: event.failure,
      };
    case "reset":
      return initialChartSessionState;
  }
}
