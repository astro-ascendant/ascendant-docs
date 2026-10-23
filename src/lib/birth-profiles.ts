export interface BirthProfile {
  name: string;
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  sex?: "Male" | "Female";
}

const STORAGE_KEY = "ascendant:birth-profiles";
const MAX_PROFILES = 20;

export function upsertBirthProfile(
  profiles: readonly BirthProfile[],
  entry: BirthProfile,
): BirthProfile[] {
  const name = entry.name.trim();
  if (name === "") {
    return [...profiles];
  }
  const rest = profiles.filter((profile) => profile.name !== name);
  return [{ ...entry, name }, ...rest].slice(0, MAX_PROFILES);
}

export function findBirthProfile(
  profiles: readonly BirthProfile[],
  name: string,
): BirthProfile | null {
  return profiles.find((profile) => profile.name === name.trim()) ?? null;
}

function storageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

export function loadBirthProfiles(): BirthProfile[] {
  if (!storageAvailable()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is BirthProfile =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as BirthProfile).name === "string" &&
        typeof (entry as BirthProfile).place === "string" &&
        Number.isFinite((entry as BirthProfile).latitude) &&
        Number.isFinite((entry as BirthProfile).longitude),
    );
  } catch {
    return [];
  }
}

export function saveBirthProfiles(profiles: readonly BirthProfile[]): void {
  if (!storageAvailable()) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Storage full or unavailable; profiles simply won't persist.
  }
}
