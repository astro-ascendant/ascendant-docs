import { createContext, use, useRef, useState, type ReactNode } from "react";
import { buildChartPdf } from "@/lib/chart-pdf";
import {
  buildChatGptPromptUrl,
  toUtcIso,
  validateChartInput,
  type ChartBirthInput,
  type ChartFieldKey,
  type ChartResult,
} from "@/lib/chart";
import {
  findBirthProfile,
  loadBirthProfiles,
  saveBirthProfiles,
  upsertBirthProfile,
  type BirthProfile,
} from "@/lib/birth-profiles";
import { searchPlaces, type PlaceOption } from "@/lib/place";
import { fetchTimeZone, resolveOffsetMinutes, todayDateString } from "@/lib/timezone";

export type ChartStatus = "empty" | "calculating" | "failure" | "success";

export interface ChartPageState {
  birth: ChartBirthInput;
  selectedPlace: PlaceOption | null;
  /** IANA zone resolved for the birth place, when the lookup found one. */
  placeZone: string | null;
  placeOptions: PlaceOption[];
  searchError: string;
  savedProfiles: BirthProfile[];
  status: ChartStatus;
  result: ChartResult | null;
  errors: string[];
  fieldErrors: Partial<Record<ChartFieldKey, string>>;
}

export interface ChartPageActions {
  updateBirth: (patch: Partial<ChartBirthInput>) => void;
  queryPlaces: (query: string) => void;
  selectPlace: (option: PlaceOption) => void;
  applyProfile: (name: string) => void;
  calculate: () => void;
  savePdf: () => void;
  askChatGPT: () => void;
}

export interface ChartContextValue {
  state: ChartPageState;
  actions: ChartPageActions;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart(): ChartContextValue {
  const value = use(ChartContext);
  if (!value) {
    throw new Error("Chart components must be used inside Chart.Provider.");
  }
  return value;
}

function defaultUtcOffset(): number {
  return -new Date().getTimezoneOffset();
}

export function ChartProvider({ children }: { children: ReactNode }) {
  const [birth, setBirth] = useState<ChartBirthInput>({
    name: "",
    date: "",
    time: "",
    utcOffsetMinutes: defaultUtcOffset(),
    place: "",
    latitude: Number.NaN,
    longitude: Number.NaN,
  });
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [placeZone, setPlaceZone] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<BirthProfile[]>(() => loadBirthProfiles());
  const [status, setStatus] = useState<ChartStatus>("empty");
  const [result, setResult] = useState<ChartResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ChartFieldKey, string>>>({});

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectSequence = useRef(0);
  // Tracks the last auto-detected offset so date/time edits re-resolve it
  // against the detected zone.
  const autoOffset = useRef<number | null>(null);

  const updateBirth = (patch: Partial<ChartBirthInput>) => {
    setFieldErrors((current) => {
      const next = { ...current };
      if (patch.name !== undefined) {
        delete next.name;
      }
      if (patch.date !== undefined) {
        delete next.date;
      }
      if (patch.time !== undefined) {
        delete next.time;
      }
      if (patch.place !== undefined) {
        delete next.place;
      }
      return next;
    });
    setBirth((previous) => {
      const next = { ...previous, ...patch };
      if (
        (patch.date !== undefined || patch.time !== undefined) &&
        autoOffset.current !== null &&
        previous.utcOffsetMinutes === autoOffset.current &&
        placeZone !== null
      ) {
        const resolved = resolveOffsetMinutes(
          next.date === "" ? todayDateString() : next.date,
          next.time === "" ? "12:00" : next.time,
          placeZone,
        );
        if (resolved !== null) {
          next.utcOffsetMinutes = resolved;
          autoOffset.current = resolved;
        }
      }
      return next;
    });
  };

  const runPlaceSearch = async (query: string) => {
    setSearchError("");
    try {
      const options = await searchPlaces(query);
      setPlaceOptions(options);
      if (options.length === 0) {
        setSearchError("No places found. Try a different spelling.");
      }
    } catch {
      setSearchError("Place search failed. Check your connection and retry.");
    }
  };

  const queryPlaces = (text: string) => {
    // Typing only searches; coordinates come exclusively from selectPlace so
    // validation forces picking a suggestion from the list.
    if (searchTimer.current !== null) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
    const query = text.trim();
    setFieldErrors((current) => {
      if (current.place === undefined) {
        return current;
      }
      const next = { ...current };
      delete next.place;
      return next;
    });
    if (query.length < 3) {
      setPlaceOptions([]);
      setSearchError("");
      return;
    }
    searchTimer.current = setTimeout(() => {
      void runPlaceSearch(query);
    }, 400);
  };

  const selectPlace = (option: PlaceOption) => {
    const sequence = ++selectSequence.current;
    setSelectedPlace(option);
    setPlaceZone(null);
    autoOffset.current = null;
    setBirth((previous) => ({
      ...previous,
      place: option.displayName,
      latitude: option.latitude,
      longitude: option.longitude,
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.place;
      return next;
    });
    void (async () => {
      const zone = await fetchTimeZone(option.latitude, option.longitude);
      if (selectSequence.current !== sequence || zone === null) {
        return;
      }
      setPlaceZone(zone);
      setBirth((previous) => {
        const resolved = resolveOffsetMinutes(
          previous.date === "" ? todayDateString() : previous.date,
          previous.time === "" ? "12:00" : previous.time,
          zone,
        );
        if (resolved === null) {
          return previous;
        }
        autoOffset.current = resolved;
        return { ...previous, utcOffsetMinutes: resolved };
      });
    })();
  };

  const applyProfile = (name: string) => {
    const profile = findBirthProfile(savedProfiles, name);
    if (!profile) {
      return;
    }
    const sequence = ++selectSequence.current;
    setFieldErrors({});
    setBirth({
      name: profile.name,
      date: profile.date,
      time: profile.time,
      utcOffsetMinutes: profile.utcOffsetMinutes,
      place: profile.place,
      latitude: profile.latitude,
      longitude: profile.longitude,
      sex: profile.sex,
    });
    setSelectedPlace({
      id: `saved:${profile.place}`,
      name: profile.place.split(",")[0]?.trim() || profile.place,
      displayName: profile.place,
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
    // Respect the saved offset; only label the zone, never auto-apply.
    setPlaceZone(null);
    autoOffset.current = null;
    void fetchTimeZone(profile.latitude, profile.longitude).then((zone) => {
      if (selectSequence.current !== sequence || zone === null) {
        return;
      }
      setPlaceZone(zone);
    });
  };

  const calculate = async () => {
    const validation = validateChartInput(birth);
    if (!validation.ok) {
      setFieldErrors(validation.fields);
      setErrors([]);
      setStatus("empty");
      setResult(null);
      const first = (["name", "date", "time", "place"] as const).find(
        (key) => validation.fields[key],
      );
      if (first !== undefined) {
        queueMicrotask(() => {
          document.getElementById(`chart-${first}`)?.focus();
        });
      }
      return;
    }
    setFieldErrors({});
    setErrors([]);
    setStatus("calculating");
    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utcIso: toUtcIso(birth),
          latitude: birth.latitude,
          longitude: birth.longitude,
          place: birth.place,
          name: birth.name.trim(),
          ...(birth.sex ? { sex: birth.sex } : {}),
        }),
      });
      const payload = (await response.json()) as ChartResult | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Calculation failed.");
      }
      setResult(payload);
      setStatus("success");
      if (birth.name.trim() !== "") {
        const next = upsertBirthProfile(savedProfiles, {
          name: birth.name.trim(),
          date: birth.date,
          time: birth.time,
          utcOffsetMinutes: birth.utcOffsetMinutes,
          place: birth.place,
          latitude: birth.latitude,
          longitude: birth.longitude,
          sex: birth.sex,
        });
        setSavedProfiles(next);
        saveBirthProfiles(next);
      }
    } catch (error) {
      console.error(error);
      setResult(null);
      setStatus("failure");
      setErrors(["Unable to calculate the chart. Check your connection and try again."]);
    }
  };

  const savePdf = () => {
    if (!result) {
      return;
    }
    const blob = buildChartPdf(result);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "birth-chart.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const askChatGPT = () => {
    if (!result) {
      return;
    }
    window.open(buildChatGptPromptUrl(result), "_blank", "noopener");
  };

  return (
    <ChartContext
      value={{
        state: {
          birth,
          selectedPlace,
          placeZone,
          placeOptions,
          searchError,
          savedProfiles,
          status,
          result,
          errors,
          fieldErrors,
        },
        actions: {
          updateBirth,
          queryPlaces,
          selectPlace,
          applyProfile,
          calculate,
          savePdf,
          askChatGPT,
        },
      }}
    >
      {children}
    </ChartContext>
  );
}
