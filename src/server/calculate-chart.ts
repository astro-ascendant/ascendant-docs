import {
  Argala,
  ArudhaPada,
  AstroParams,
  Chart,
  CharaKarakas,
  Dasha,
  Karakamsha,
  RashiDrishti,
  SAV,
  Swisseph,
  Upapada,
} from "astro-ascendant";
import { Data, DateTime, Effect, Option } from "effect";
import { ALL_DIVISIONS, type ChartResult } from "@/lib/chart";
import {
  HOUSES,
  d1Lagna,
  toChartResult,
  type ArudhaMappingResult,
  type ChartMappingOptional,
} from "./chart-mapping";

export interface CalculateChartInput {
  /** The birth instant, decoded from a moment with an explicit offset. */
  readonly moment: Chart.Moment;
  readonly latitude: number;
  readonly longitude: number;
  readonly place: string;
  readonly name?: string;
  readonly sex?: "Male" | "Female";
  /** Wall-clock birth date at the place, YYYY-MM-DD. */
  readonly localDate?: string;
  /** Wall-clock birth time at the place, HH:MM(:SS). */
  readonly localTime?: string;
  /** Verbatim offset the instant was built from, e.g. "+03:00". */
  readonly offset?: string | null;
  /** IANA zone resolved from the coordinates, for display only. */
  readonly timeZone?: string | null;
}

export class CalculateChartError extends Data.TaggedError(
  "CalculateChartError",
)<{
  readonly message: string;
}> {}

const KpAstroParams = AstroParams.AstroParams.of({
  ayanamsa: "KrishnamurtiVP291",
  houseSystem: "Placidus",
});

function describeError(error: unknown): string {
  if (error instanceof Error && error.message !== "") {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "_tag" in error) {
    return String((error as { _tag: unknown })._tag);
  }
  try {
    const json = JSON.stringify(error);
    return json === undefined ? "Calculation failed." : json;
  } catch {
    return "Calculation failed.";
  }
}

export const calculateChart = Effect.fn("Chart.calculate")(
  function* (input: CalculateChartInput) {
    const moment = input.moment;
    const chartInput = Chart.ChartParams.make({
      moment,
      latitude: input.latitude,
      longitude: input.longitude,
      ...(input.sex ? { sex: input.sex } : {}),
    });
    const calculation = yield* Chart.generate(chartInput, [
      ...ALL_DIVISIONS,
    ]).pipe(
      Effect.tap(() => Effect.logInfo("chart stage complete")),
      Effect.withLogSpan("chart.primary"),
    );
    const kpCalculation = yield* Chart.generate(chartInput, [1]).pipe(
      Effect.provideService(AstroParams.AstroParams, KpAstroParams),
      Effect.tap(() => Effect.logInfo("chart stage complete")),
      Effect.withLogSpan("chart.kp"),
    );

    const { lagnaSign, optional } = yield* Effect.gen(function* () {
      const placements = calculation.placements;
      const { sign: lagnaSign } = d1Lagna(calculation);

      // The KP dasha follows the KP chart's own ayanamsa, so its period
      // boundaries can differ from the Lahiri timeline.
      const kpVimshottari = yield* Effect.option(
        Dasha.calculate(moment, kpCalculation.placements),
      );
      const vimshottari = yield* Effect.option(
        Dasha.calculate(moment, placements),
      );
      const chara = yield* Effect.option(
        Dasha.calculateChara(moment, placements),
      );
      const sthira = yield* Effect.option(
        Dasha.calculateSthira(moment, placements),
      );
      const sav = yield* Effect.option(SAV.calculate(placements));
      const karakas = yield* Effect.option(CharaKarakas.calculate(placements));
      const karakamsha = yield* Effect.option(Karakamsha.calculate(placements));
      const upapada = yield* Effect.option(Upapada.calculate(placements));
      const drishti = yield* Effect.option(RashiDrishti.calculate(lagnaSign));
      const argala = yield* Effect.option(
        Argala.calculate(placements, { kind: "Sign", sign: lagnaSign }),
      );

      const arudha: (ArudhaMappingResult | null)[] = [];
      for (const house of HOUSES) {
        const pada = yield* Effect.option(
          ArudhaPada.calculate(placements, house),
        );
        arudha.push(Option.getOrElse(pada, () => null));
      }

      const optional: ChartMappingOptional = {
        vimshottari: Option.getOrElse(vimshottari, () => null),
        kpVimshottari: Option.getOrElse(kpVimshottari, () => null),
        chara: Option.getOrElse(chara, () => null),
        sthira: Option.getOrElse(sthira, () => null),
        sav: Option.getOrElse(sav, () => null),
        karakas: Option.getOrElse(karakas, () => null),
        karakamsha: Option.getOrElse(karakamsha, () => null),
        upapada: Option.getOrElse(upapada, () => null),
        drishti: Option.getOrElse(drishti, () => null),
        argala: Option.getOrElse(argala, () => null),
        arudha,
      };
      return { lagnaSign, optional };
    }).pipe(
      Effect.tap(() => Effect.logInfo("chart stage complete")),
      Effect.withLogSpan("chart.derived"),
    );

    return toChartResult({
      calculation,
      kpCalculation,
      birth: {
        name: input.name ?? "",
        utcIso: DateTime.formatIso(moment.date),
        date: input.localDate ?? "",
        time: input.localTime ?? "",
        timeZone: input.timeZone ?? null,
        utcOffset: input.offset ?? null,
        place: input.place,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      optional,
    });
  },
  (effect) =>
    effect.pipe(
      Effect.mapError((error) =>
        error instanceof CalculateChartError
          ? error
          : new CalculateChartError({ message: describeError(error) }),
      ),
    ),
);
