import type { ReactNode } from "react";
import {
  ChartFormProvider,
  useChartFormController,
  type ChartFormDeps,
} from "./form-context";
import {
  ChartPlaceProvider,
  useChartPlaceSearchController,
  type ChartPlaceSearchDeps,
} from "./place-context";
import {
  ChartSessionProvider,
  useChartSessionController,
  type ChartSessionDeps,
} from "./session-context";

export interface ChartProviderDeps {
  form?: Partial<ChartFormDeps>;
  place?: Partial<ChartPlaceSearchDeps>;
  session?: Partial<ChartSessionDeps>;
}

/**
 * Composes the three chart concerns: the editable birth form, the debounced
 * place search, and the calculation session. Each has its own context so a
 * component depends only on the state it reads.
 */
export function ChartProvider({
  children,
  deps,
}: {
  children: ReactNode;
  deps?: ChartProviderDeps;
}) {
  const form = useChartFormController(deps?.form);
  const place = useChartPlaceSearchController({
    onQuery: () => form.actions.clearFieldError("place"),
    deps: deps?.place,
  });
  const session = useChartSessionController({
    birth: form.state.birth,
    onInvalid: form.actions.showFieldErrors,
    onSavedProfile: form.actions.rememberProfile,
    deps: deps?.session,
  });

  return (
    <ChartFormProvider value={form}>
      <ChartPlaceProvider value={place}>
        <ChartSessionProvider value={session}>{children}</ChartSessionProvider>
      </ChartPlaceProvider>
    </ChartFormProvider>
  );
}

export { useChartForm } from "./form-context";
export { useChartPlaceSearch } from "./place-context";
export { useChartSession } from "./session-context";
export type {
  ChartFormActions,
  ChartFormState,
  ChartFormValue,
} from "./form-context";
export type {
  ChartPlaceActions,
  ChartPlaceState,
  ChartPlaceValue,
} from "./place-context";
export type {
  ChartSessionActions,
  ChartSessionDeps,
  ChartSessionValue,
} from "./session-context";
export type { ChartSessionState, ChartStatus } from "./session-state";
