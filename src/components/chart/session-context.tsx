import { createContext, use, useReducer, useRef, type ReactNode } from "react";
import { buildChartPdf } from "@/lib/chart-pdf";
import {
  buildChatGptPromptUrl,
  validateChartInput,
  type ChartBirthInput,
  type ChartFieldKey,
  type ChartResult,
} from "@/lib/chart";
import {
  initialChartSessionState,
  reduceChartSession,
  type ChartSessionState,
} from "./session-state";

export interface ChartSessionActions {
  calculate: () => void;
  savePdf: () => void;
  askChatGPT: () => void;
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
  askChatGPT: (result: ChartResult) => void;
}

class ChartRequestError extends Error {}

async function requestChart(birth: ChartBirthInput): Promise<ChartResult> {
  // Send the wall-clock birth moment and coordinates; the server resolves
  // the place's zone so the chart never depends on the browser's own zone.
  const response = await fetch("/api/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: birth.date,
      time: birth.time,
      latitude: birth.latitude,
      longitude: birth.longitude,
      place: birth.place,
      name: birth.name.trim(),
      ...(birth.sex ? { sex: birth.sex } : {}),
    }),
  });
  const payload = (await response.json()) as ChartResult | { error: string };
  if (!response.ok || "error" in payload) {
    throw new ChartRequestError("error" in payload ? payload.error : "Calculation failed.");
  }
  return payload;
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

function openChatGpt(result: ChartResult): void {
  window.open(buildChatGptPromptUrl(result), "_blank", "noopener");
}

const defaultDeps: ChartSessionDeps = {
  requestChart,
  clock: () => new Date().toISOString(),
  savePdf: downloadPdf,
  askChatGPT: openChatGpt,
};

const ChartSessionContext = createContext<ChartSessionValue | null>(null);

export function useChartSession(): ChartSessionValue {
  const value = use(ChartSessionContext);
  if (!value) {
    throw new Error("Chart result components must be used inside Chart.Provider.");
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

const MISSING_CONNECTION = "Unable to calculate the chart. Check your connection and try again.";

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
    askChatGPT: openPrompt,
  } = {
    ...defaultDeps,
    ...deps,
  };
  const [state, dispatch] = useReducer(reduceChartSession, initialChartSessionState);
  const requestId = useRef(0);

  const calculate = () => {
    const validation = validateChartInput(birth);
    if (!validation.ok) {
      onInvalid(validation.fields);
      dispatch({ type: "reset" });
      return;
    }
    const id = requestId.current + 1;
    requestId.current = id;
    dispatch({ type: "start" });

    void (async () => {
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
        console.error(error);
        dispatch({
          type: "fail",
          errors: [error instanceof ChartRequestError ? error.message : MISSING_CONNECTION],
        });
      }
    })();
  };

  const savePdf = () => {
    if (state.result !== null) {
      savePdfFile(state.result);
    }
  };

  const askChatGPT = () => {
    if (state.result !== null) {
      openPrompt(state.result);
    }
  };

  return {
    state,
    actions: { calculate, savePdf, askChatGPT },
    clock,
  };
}
