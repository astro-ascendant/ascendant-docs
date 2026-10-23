export interface PlaceOption {
  id: string;
  name: string;
  region?: string;
  country?: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  state?: string;
  country?: string;
  name?: string;
}

interface NominatimEntry {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

function placeName(entry: NominatimEntry): string {
  const address = entry.address;
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.hamlet ??
    address?.suburb ??
    address?.name ??
    entry.display_name.split(",")[0]?.trim() ??
    entry.display_name
  );
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceOption[]> {
  // V1 place search uses OpenStreetMap Nominatim (no API key); users can
  // always override with manual coordinates below.
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" }, signal },
  );
  if (!response.ok) {
    throw new Error("Place search failed.");
  }
  const data = (await response.json()) as NominatimEntry[];
  return data
    .map((entry) => ({
      id: String(entry.place_id),
      name: placeName(entry),
      region: entry.address?.state,
      country: entry.address?.country,
      displayName: entry.display_name,
      latitude: Number(entry.lat),
      longitude: Number(entry.lon),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude),
    );
}
