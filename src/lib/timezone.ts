const ZONE_LABEL_LOCALES = ["en-US", "en-GB", "en-IN"] as const;

/**
 * The zone's own abbreviation, e.g. IST or EDT, where one exists. `Intl` only
 * knows real abbreviations for some locale and zone pairs (en-US renders most
 * non-US zones as "GMT+5:30"), so try a few locales and accept the first
 * alphabetic name. Reads the abbreviation in force at `instantIso` when given,
 * so historical DST labels stay true to the chart. Returns null when there is
 * no abbreviation worth showing.
 */
export function formatTimeZoneLabel(timeZone: string, instantIso?: string): string | null {
  const parsed = instantIso === undefined ? Number.NaN : Date.parse(instantIso);
  const instant = new Date(Number.isNaN(parsed) ? Date.now() : parsed);
  for (const locale of ZONE_LABEL_LOCALES) {
    try {
      const name =
        new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
          .formatToParts(instant)
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
