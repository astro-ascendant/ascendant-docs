import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { searchPlaces, type PlaceOption } from "@/lib/place";
import { createLatestRequest, type LatestRequestGate } from "./latest-request";

export interface ChartPlaceState {
  placeOptions: PlaceOption[];
  searchError: string;
}

export interface ChartPlaceActions {
  queryPlaces: (text: string) => void;
}

export interface ChartPlaceValue {
  state: ChartPlaceState;
  actions: ChartPlaceActions;
}

export interface ChartPlaceSearchDeps {
  search: (query: string, signal: AbortSignal) => Promise<PlaceOption[]>;
  debounceMs: number;
}

const defaultDeps: ChartPlaceSearchDeps = {
  search: searchPlaces,
  debounceMs: 400,
};

const ChartPlaceContext = createContext<ChartPlaceValue | null>(null);

export function useChartPlaceSearch(): ChartPlaceValue {
  const value = use(ChartPlaceContext);
  if (!value) {
    throw new Error(
      "Chart place components must be used inside Chart.Provider.",
    );
  }
  return value;
}

export function ChartPlaceProvider({
  value,
  children,
}: {
  value: ChartPlaceValue;
  children: ReactNode;
}) {
  return <ChartPlaceContext value={value}>{children}</ChartPlaceContext>;
}

export function useChartPlaceSearchController({
  onQuery,
  deps = {},
}: {
  onQuery: () => void;
  deps?: Partial<ChartPlaceSearchDeps>;
}): ChartPlaceValue {
  const { search, debounceMs } = { ...defaultDeps, ...deps };
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [searchError, setSearchError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gate] = useState<LatestRequestGate>(createLatestRequest);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      gate.cancel();
    };
  }, [gate]);

  const runSearch = async (query: string) => {
    const request = gate.begin();
    try {
      const options = await search(query, request.signal);
      if (!gate.isCurrent(request.id)) {
        return;
      }
      setPlaceOptions(options);
      setSearchError(
        options.length === 0
          ? "No places found. Try a different spelling."
          : "",
      );
    } catch {
      if (!gate.isCurrent(request.id) || request.signal.aborted) {
        return;
      }
      setSearchError("Place search failed. Check your connection and retry.");
    }
  };

  const queryPlaces = (text: string) => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    onQuery();
    setSearchError("");
    const query = text.trim();
    if (query.length < 3) {
      gate.cancel();
      setPlaceOptions([]);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      void runSearch(query);
    }, debounceMs);
  };

  return {
    state: { placeOptions, searchError },
    actions: { queryPlaces },
  };
}
