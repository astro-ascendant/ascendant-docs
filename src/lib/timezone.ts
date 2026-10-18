export async function fetchTimeZone(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch("/api/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { timeZone?: unknown };
    return typeof data.timeZone === "string" ? data.timeZone : null;
  } catch {
    return null;
  }
}

function zoneOffsetMinutesAt(instantMs: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(instantMs)).map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - instantMs) / 60000);
}

export function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function resolveOffsetMinutes(date: string, time: string, timeZone: string): number | null {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const [hour = 0, minute = 0] = time.split(":").map(Number);
    if (![year, month, day, hour, minute].every((part) => Number.isFinite(part))) {
      return null;
    }
    const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    // Two passes so dates near a DST transition converge on the right offset.
    const first = zoneOffsetMinutesAt(wallAsUtc, timeZone);
    return zoneOffsetMinutesAt(wallAsUtc - first * 60000, timeZone);
  } catch {
    return null;
  }
}

const ZONE_LABEL_LOCALES = ["en-US", "en-GB", "en-IN"] as const;

/**
 * The zone's own abbreviation, e.g. IST or EDT, where one exists. `Intl` only
 * knows real abbreviations for some locale and zone pairs (en-US renders most
 * non-US zones as "GMT+5:30"), so try a few locales and accept the first
 * alphabetic name. Returns null when there is no abbreviation worth showing.
 */
export function formatTimeZoneLabel(timeZone: string): string | null {
  for (const locale of ZONE_LABEL_LOCALES) {
    try {
      const name =
        new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
          .formatToParts(new Date())
          .find((part) => part.type === "timeZoneName")?.value ?? "";
      if (/^[A-Za-z]{2,5}$/.test(name)) {
        return name;
      }
    } catch {
      // Unknown or unsupported zone: there is no label to offer.
      return null;
    }
  }
  return null;
}
