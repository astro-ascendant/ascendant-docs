/**
 * The sentences the server sends for failures a reader can act on. Both sides
 * import this list, so the client can tell our own instructions apart from a
 * crash instead of matching prose it does not own.
 */
export const CHART_ERROR_MESSAGES = {
  invalidRequest: "Check the birth date, time and coordinates.",
  missingMoment:
    "Send the birth date and time (date: YYYY-MM-DD, time: HH:MM).",
  impossibleMoment: "That date and time do not exist. Check the birth date.",
  unknownTimeZone:
    "Could not determine the time zone for this place. Check the coordinates.",
  unresolvedOffset: "Could not resolve the time zone offset for this place.",
  unresolvedMoment: "Could not resolve the birth moment.",
} as const;

const ACTIONABLE_MESSAGES = new Set<string>(
  Object.values(CHART_ERROR_MESSAGES),
);

/** A failure as the reader should see it: what happened, in plain words. */
export interface ChartFailure {
  readonly title: string;
  readonly message: string;
}

const OFFLINE =
  /failed to fetch|load failed|networkerror|network request failed|fetch failed|err_internet|err_network|offline/i;

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim();
  }
  return typeof error === "string" ? error.trim() : "";
}

/**
 * Turns whatever the request threw into copy that names the problem and the
 * next step. Only messages we wrote are shown verbatim; engine and transport
 * details stay in the console, where they help us and not the reader.
 */
export function describeChartError(error: unknown): ChartFailure {
  const message = messageOf(error);

  if (ACTIONABLE_MESSAGES.has(message)) {
    return { title: "Check the birth details", message };
  }

  if (OFFLINE.test(message)) {
    return {
      title: "Couldn't reach the calculator",
      message:
        "The calculation service didn't answer. Check your internet connection, then try again.",
    };
  }

  return {
    title: "The chart didn't calculate",
    message:
      "Something went wrong while casting this chart. Try again, and if it keeps happening, check the birth date, time and place.",
  };
}
