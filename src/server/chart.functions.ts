import { createServerFn } from "@tanstack/react-start";
import { Data, Effect, Exit, Option, Schema } from "effect";
import { CHART_ERROR_MESSAGES } from "@/lib/chart-errors";
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
  latitude: Schema.Finite.check(
    Schema.isBetween({ minimum: -90, maximum: 90 }),
  ),
  longitude: Schema.Finite.check(
    Schema.isBetween({ minimum: -180, maximum: 180 }),
  ),
  place: Schema.optionalKey(Schema.Trim),
  name: Schema.optionalKey(Schema.Trim),
  sex: Schema.optionalKey(Schema.Literals(["Male", "Female"])),
});

export const getChart = createServerFn({ method: "POST" })
  .validator((input: Schema.Codec.Encoded<typeof ChartRequest>) => {
    try {
      return Schema.decodeUnknownSync(ChartRequest)(input);
    } catch {
      throw new Error(CHART_ERROR_MESSAGES.invalidRequest);
    }
  })
  .handler(async ({ data }) => {
    class HttpError extends Data.TaggedError("HttpError")<{
      readonly message: string;
    }> {}

    const httpError = (message: string) => new HttpError({ message });
    const program = Effect.fn("Chart.request")(
      function* (body: Schema.Schema.Type<typeof ChartRequest>) {
        const date = body.date ?? "";
        const time = body.time ?? "";

        const resolved = yield* date === "" && time === ""
          ? body.utcIso === undefined
            ? Effect.fail(new MissingMomentError())
            : resolveOffsetMoment(body.utcIso)
          : Effect.gen(function* () {
              const wall = yield* Schema.decodeUnknownEffect(WallClock)({
                date,
                time,
              });
              return yield* resolveBirthMoment(
                wall,
                body.latitude,
                body.longitude,
              );
            });

        // Calculation engine: astro-ascendant (Effect-first TypeScript,
        // Swiss Ephemeris via SwissephLayer). The Effect program lives in
        // src/server/calculate-chart.ts with static typed imports; the client
        // only sees the JSON contract in src/lib/chart.ts.
        return yield* calculateChart({
          moment: resolved.moment,
          latitude: body.latitude,
          longitude: body.longitude,
          place: body.place ?? "",
          name: body.name ?? "",
          ...(body.sex === undefined ? {} : { sex: body.sex }),
          localDate: date,
          localTime: time,
          offset: resolved.offset,
          timeZone: "timeZone" in resolved ? resolved.timeZone : null,
        });
      },
      (effect) =>
        effect.pipe(
          Effect.catchTags({
            SchemaError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.invalidRequest)),
            MissingMomentError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.missingMoment)),
            InvalidWallClockError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.impossibleMoment)),
            TimeZoneLookupError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.unknownTimeZone)),
            OffsetLookupError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.unresolvedOffset)),
            MomentDecodeError: () =>
              Effect.fail(httpError(CHART_ERROR_MESSAGES.unresolvedMoment)),
            CalculateChartError: (error) =>
              Effect.fail(httpError(error.message)),
          }),
        ),
    );

    const exit = await runtime.runPromiseExit(
      program(data).pipe(
        Effect.tapDefect(Effect.logError),
        Effect.tap(() => Effect.logInfo("chart calculation complete")),
        Effect.withLogSpan("chart.total"),
      ),
    );
    if (Exit.isSuccess(exit)) return exit.value;
    const failure = Exit.findErrorOption(exit);
    if (
      Option.isSome(failure) &&
      typeof failure.value === "object" &&
      failure.value !== null &&
      "message" in failure.value &&
      typeof failure.value.message === "string"
    ) {
      throw new Error(failure.value.message);
    }
    throw new Error("Internal error");
  });
