import { createFileRoute } from "@tanstack/react-router";
import { Data, Effect, Schema } from "effect";
import { findTimeZone } from "@/server/birth-moment";

const ZoneRequest = Schema.Struct({
  latitude: Schema.Finite.check(
    Schema.isBetween({ minimum: -90, maximum: 90 }),
  ),
  longitude: Schema.Finite.check(
    Schema.isBetween({ minimum: -180, maximum: 180 }),
  ),
});

class HttpError extends Data.TaggedError("HttpError")<{
  readonly status: number;
  readonly message: string;
}> {}

const program = Effect.fn("TimeZone.request")(
  function* (body: unknown) {
    const { latitude, longitude } =
      yield* Schema.decodeUnknownEffect(ZoneRequest)(body);
    return yield* findTimeZone(latitude, longitude);
  },
  (effect) =>
    effect.pipe(
      Effect.catchTags({
        SchemaError: () =>
          Effect.fail(
            new HttpError({ status: 400, message: "Check the coordinates." }),
          ),
        TimeZoneLookupError: () =>
          Effect.fail(
            new HttpError({
              status: 422,
              message:
                "Could not determine the time zone for this place. Check the coordinates.",
            }),
          ),
      }),
      Effect.map((timeZone) => ({ timeZone })),
    ),
);

export const Route = createFileRoute("/api/timezone")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Request body must be JSON." },
            { status: 400 },
          );
        }
        return Effect.runPromise(
          program(body).pipe(
            Effect.match({
              onFailure: (error) =>
                Response.json(
                  { error: error.message },
                  { status: error.status },
                ),
              onSuccess: (result) => Response.json(result),
            }),
          ),
        );
      },
    },
  },
});
