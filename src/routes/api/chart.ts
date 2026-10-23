import { createFileRoute } from "@tanstack/react-router";
import { Data, Effect, Schema } from "effect";
import {
  MissingMomentError,
  OffsetMoment,
  resolveBirthMoment,
  resolveOffsetMoment,
  WallClock,
} from "@/server/birth-moment";
import { calculateChart } from "@/server/calculate-chart";
import { runtime } from "@/server/runtime.server";

/**
 * The birth is accepted as a wall clock at a place (`date` + `time`), which
 * the server resolves to one instant plus the offset in force there. A caller
 * that already knows the instant may send `utcIso` instead, but only with an
 * explicit offset: a bare local time would be read as UTC and silently shift
 * the chart.
 */
const ChartRequest = Schema.Struct({
  date: Schema.optionalKey(Schema.Trim),
  time: Schema.optionalKey(Schema.Trim),
  utcIso: Schema.optionalKey(OffsetMoment),
  latitude: Schema.Finite.check(Schema.isBetween({ minimum: -90, maximum: 90 })),
  longitude: Schema.Finite.check(Schema.isBetween({ minimum: -180, maximum: 180 })),
  place: Schema.optionalKey(Schema.Trim),
  name: Schema.optionalKey(Schema.Trim),
  sex: Schema.optionalKey(Schema.Literals(["Male", "Female"])),
});

class HttpError extends Data.TaggedError("HttpError")<{
  readonly status: number;
  readonly message: string;
}> {}

const badRequest = (message: string) => new HttpError({ status: 400, message });
const unprocessable = (message: string) => new HttpError({ status: 422, message });

const program = (body: unknown) =>
  Effect.gen(function* () {
    const input = yield* Schema.decodeUnknownEffect(ChartRequest)(body);
    const date = input.date ?? "";
    const time = input.time ?? "";

    const resolved = yield* date === "" && time === ""
      ? input.utcIso === undefined
        ? Effect.fail(new MissingMomentError())
        : resolveOffsetMoment(input.utcIso)
      : Effect.gen(function* () {
          const wall = yield* Schema.decodeUnknownEffect(WallClock)({ date, time });
          return yield* resolveBirthMoment(wall, input.latitude, input.longitude);
        });

    // Calculation engine: astro-ascendant (Effect-first TypeScript,
    // Swiss Ephemeris via SwissephLayer). The Effect program lives in
    // src/server/calculate-chart.ts with static typed imports; the client
    // only sees the JSON contract in src/lib/chart.ts.
    return yield* calculateChart({
      moment: resolved.moment,
      latitude: input.latitude,
      longitude: input.longitude,
      place: input.place ?? "",
      name: input.name ?? "",
      ...(input.sex === undefined ? {} : { sex: input.sex }),
      localDate: date,
      localTime: time,
      offset: resolved.offset,
      timeZone: "timeZone" in resolved ? resolved.timeZone : null,
    });
  }).pipe(
    Effect.catchTags({
      SchemaError: () => Effect.fail(badRequest("Check the birth date, time and coordinates.")),
      MissingMomentError: () =>
        Effect.fail(badRequest("Send the birth date and time (date: YYYY-MM-DD, time: HH:MM).")),
      InvalidWallClockError: () =>
        Effect.fail(badRequest("That date and time do not exist. Check the birth date.")),
      TimeZoneLookupError: () =>
        Effect.fail(
          unprocessable("Could not determine the time zone for this place. Check the coordinates."),
        ),
      OffsetLookupError: () =>
        Effect.fail(unprocessable("Could not resolve the time zone offset for this place.")),
      MomentDecodeError: () => Effect.fail(unprocessable("Could not resolve the birth moment.")),
      CalculateChartError: (error) => Effect.fail(unprocessable(error.message)),
    }),
  );

export const Route = createFileRoute("/api/chart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Request body must be JSON." }, { status: 400 });
        }
        return runtime.runPromise(
          program(body).pipe(
            Effect.match({
              onFailure: (error) =>
                Response.json({ error: error.message }, { status: error.status }),
              onSuccess: (result) => Response.json(result),
            }),
          ),
        );
      },
    },
  },
});
