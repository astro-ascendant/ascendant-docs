import { describe, expect, test } from "bun:test";
import { Route } from "../routes/api/chart";

const handlers = Route.options.server?.handlers;
if (handlers === undefined || typeof handlers === "function" || !("POST" in handlers)) {
  throw new Error("Expected POST /api/chart handler.");
}
const postHandler = handlers.POST;
if (postHandler === undefined) {
  throw new Error("Expected POST /api/chart handler.");
}

const post = async (body: string): Promise<Response> => {
  const response = await postHandler({
    request: new Request("http://localhost/api/chart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
    context: undefined,
    params: {},
    pathname: "/api/chart",
    next: <TContext = undefined>(options?: { context?: TContext }) => ({
      isNext: true as const,
      context: options?.context as TContext,
    }),
  });
  if (!(response instanceof Response)) {
    throw new Error("Expected chart handler to return a Response.");
  }
  return response;
};

describe("POST /api/chart", () => {
  test("returns the established chart result shape", async () => {
    const response = await post(
      JSON.stringify({
        date: "1990-01-01",
        time: "12:00",
        latitude: 13.0827,
        longitude: 80.2707,
        place: "Chennai",
        name: "Test",
      }),
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(Object.keys(result).sort()).toEqual(
      ["birth", "astroParams", "lagna", "kp", "divisions", "dasha", "jaimini", "sav"].sort(),
    );
    expect(result.birth).toMatchObject({
      date: "1990-01-01",
      time: "12:00",
      timeZone: "Asia/Kolkata",
      utcOffset: "+05:30",
      latitude: 13.0827,
      longitude: 80.2707,
    });
    expect(result.divisions).toHaveLength(16);
  });

  test("reports malformed JSON as a 400 response", async () => {
    const response = await post("{");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request body must be JSON." });
  });

  test("reports invalid chart input as a 400 response", async () => {
    const response = await post(JSON.stringify({ latitude: "not-a-number", longitude: 0 }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Check the birth date, time and coordinates.",
    });
  });

  test("reports a missing birth moment as a typed 400 failure", async () => {
    const response = await post(JSON.stringify({ latitude: 0, longitude: 0 }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Send the birth date and time (date: YYYY-MM-DD, time: HH:MM).",
    });
  });
});
