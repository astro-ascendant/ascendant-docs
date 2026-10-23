import { createContext, use, useState, type ReactNode } from "react";
import {
  findBirthProfile,
  loadBirthProfiles,
  saveBirthProfiles,
  upsertBirthProfile,
  type BirthProfile,
} from "@/lib/birth-profiles";
import type { ChartBirthInput, ChartFieldKey } from "@/lib/chart";
import type { PlaceOption } from "@/lib/place";

export interface ChartFormState {
  birth: ChartBirthInput;
  selectedPlace: PlaceOption | null;
  savedProfiles: BirthProfile[];
  fieldErrors: Partial<Record<ChartFieldKey, string>>;
}

export interface ChartFormActions {
  updateBirth: (patch: Partial<ChartBirthInput>) => void;
  selectPlace: (option: PlaceOption) => void;
  applyProfile: (name: string) => void;
  clearFieldError: (key: ChartFieldKey) => void;
  showFieldErrors: (fields: Partial<Record<ChartFieldKey, string>>) => void;
  rememberProfile: (birth: ChartBirthInput) => void;
}

export interface ChartFormValue {
  state: ChartFormState;
  actions: ChartFormActions;
}

export interface ChartFormDeps {
  loadProfiles: () => BirthProfile[];
  saveProfiles: (profiles: readonly BirthProfile[]) => void;
}

const defaultDeps: ChartFormDeps = {
  loadProfiles: loadBirthProfiles,
  saveProfiles: saveBirthProfiles,
};

const ChartFormContext = createContext<ChartFormValue | null>(null);

export function useChartForm(): ChartFormValue {
  const value = use(ChartFormContext);
  if (!value) {
    throw new Error(
      "Chart form components must be used inside Chart.Provider.",
    );
  }
  return value;
}

export function ChartFormProvider({
  value,
  children,
}: {
  value: ChartFormValue;
  children: ReactNode;
}) {
  return <ChartFormContext value={value}>{children}</ChartFormContext>;
}

const EMPTY_BIRTH: ChartBirthInput = {
  name: "",
  date: "",
  time: "",
  place: "",
  latitude: Number.NaN,
  longitude: Number.NaN,
};

export function useChartFormController(
  deps: Partial<ChartFormDeps> = {},
): ChartFormValue {
  const { loadProfiles, saveProfiles } = { ...defaultDeps, ...deps };
  const [birth, setBirth] = useState<ChartBirthInput>(EMPTY_BIRTH);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<BirthProfile[]>(() =>
    loadProfiles(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ChartFieldKey, string>>
  >({});

  const clearFieldError = (key: ChartFieldKey) => {
    setFieldErrors((current) => {
      if (current[key] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

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
    setBirth((previous) => ({ ...previous, ...patch }));
  };

  const selectPlace = (option: PlaceOption) => {
    setSelectedPlace(option);
    setBirth((previous) => ({
      ...previous,
      place: option.displayName,
      latitude: option.latitude,
      longitude: option.longitude,
    }));
    clearFieldError("place");
  };

  const applyProfile = (name: string) => {
    const profile = findBirthProfile(savedProfiles, name);
    if (!profile) {
      return;
    }
    setFieldErrors({});
    setBirth({
      name: profile.name,
      date: profile.date,
      time: profile.time,
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
  };

  const showFieldErrors = (fields: Partial<Record<ChartFieldKey, string>>) => {
    setFieldErrors(fields);
    const first = (["name", "date", "time", "place"] as const).find(
      (key) => fields[key],
    );
    if (first !== undefined && typeof document !== "undefined") {
      queueMicrotask(() => {
        document.getElementById(`chart-${first}`)?.focus();
      });
    }
  };

  const rememberProfile = (entry: ChartBirthInput) => {
    const name = entry.name.trim();
    if (name === "") {
      return;
    }
    setSavedProfiles((current) => {
      const next = upsertBirthProfile(current, { ...entry, name });
      saveProfiles(next);
      return next;
    });
  };

  return {
    state: { birth, selectedPlace, savedProfiles, fieldErrors },
    actions: {
      updateBirth,
      selectPlace,
      applyProfile,
      clearFieldError,
      showFieldErrors,
      rememberProfile,
    },
  };
}
