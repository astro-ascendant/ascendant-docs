import { createContext, use, useReducer, useRef, type ReactNode } from "react";
import { buildChartPdf } from "@/lib/chart-pdf";
import { describeChartError } from "@/lib/chart-errors";
import { getChart } from "@/server/chart.functions";
import {
  buildChartPromptUrl,
  validateChartInput,
  type ChartBirthInput,
  type ChartFieldKey,
  type ChartPromptProvider,
  type ChartResult,
} from "@/lib/chart";
import {
  initialChartSessionState,
  reduceChartSession,
  type ChartSessionState,
} from "./session-state";

export interface ChartSessionActions {
  calculate: () => Promise<void>;
  savePdf: () => void;
  askAI: (provider: ChartPromptProvider) => void;
}

export interface ChartSessionValue {
  state: ChartSessionState;
  actions: ChartSessionActions;
  clock: () => string;
}

export interface ChartSessionDeps {
  requestChart: (birth: ChartBirthInput) => Promise<ChartResult>;
  clock: () => string;
  savePdf: (result: ChartResult) => void;
  askAI: (result: ChartResult, provider: ChartPromptProvider) => void;
}

function requestChart(birth: ChartBirthInput): Promise<ChartResult> {
  return getChart({
    data: {
      date: birth.date,
      time: birth.time,
      latitude: birth.latitude,
      longitude: birth.longitude,
      place: birth.place,
      name: birth.name.trim(),
      ...(birth.sex ? { sex: birth.sex } : {}),
    },
  });
}

function downloadPdf(result: ChartResult): void {
  const blob = buildChartPdf(result);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "birth-chart.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function openPrompt(result: ChartResult, provider: ChartPromptProvider): void {
  window.open(buildChartPromptUrl(result, provider), "_blank", "noopener");
}

const defaultDeps: ChartSessionDeps = {
  requestChart,
  clock: () => new Date().toISOString(),
  savePdf: downloadPdf,
  askAI: openPrompt,
};

const ChartSessionContext = createContext<ChartSessionValue | null>(null);

export function useChartSession(): ChartSessionValue {
  const value = use(ChartSessionContext);
  if (!value) {
    throw new Error(
      "Chart result components must be used inside Chart.Provider.",
    );
  }
  return value;
}

export function ChartSessionProvider({
  value,
  children,
}: {
  value: ChartSessionValue;
  children: ReactNode;
}) {
  return <ChartSessionContext value={value}>{children}</ChartSessionContext>;
}

export function useChartSessionController({
  birth,
  onInvalid,
  onSavedProfile,
  deps = {},
}: {
  birth: ChartBirthInput;
  onInvalid: (fields: Partial<Record<ChartFieldKey, string>>) => void;
  onSavedProfile: (birth: ChartBirthInput) => void;
  deps?: Partial<ChartSessionDeps>;
}): ChartSessionValue {
  const {
    requestChart,
    clock,
    savePdf: savePdfFile,
    askAI: openPrompt,
  } = {
    ...defaultDeps,
    ...deps,
  };
  const [state, dispatch] = useReducer(
    reduceChartSession,
    initialChartSessionState,
  );
  const requestId = useRef(0);

  const calculate = async () => {
    const validation = validateChartInput(birth);
    if (!validation.ok) {
      onInvalid(validation.fields);
      dispatch({ type: "reset" });
      throw new Error("Chart details are incomplete.");
    }
    const id = requestId.current + 1;
    requestId.current = id;
    dispatch({ type: "start", birth });

    try {
      const result = await requestChart(birth);
      if (requestId.current !== id) {
        return;
      }
      dispatch({ type: "succeed", result });
      if (birth.name.trim() !== "") {
        onSavedProfile(birth);
      }
    } catch (error) {
      if (requestId.current !== id) {
        return;
      }
      console.error("Chart calculation failed", error);
      dispatch({ type: "fail", failure: describeChartError(error) });
      throw error;
    }
  };

  const savePdf = () => {
    if (state.result !== null) {
      savePdfFile(state.result);
    }
  };

  const askAI = (provider: ChartPromptProvider) => {
    if (state.result !== null) {
      openPrompt(state.result, provider);
    }
  };

  return {
    state,
    actions: { calculate, savePdf, askAI },
    clock,
  };
}
