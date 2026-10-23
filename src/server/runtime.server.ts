import { AstroParams, Ephemeris, Swisseph } from "astro-ascendant";
import { Layer, ManagedRuntime } from "effect";

const ChartLayer = Layer.mergeAll(
  AstroParams.layer({ ayanamsa: "Lahiri", houseSystem: "WholeSign" }),
  Swisseph.SwissephLayer,
);

const runtime = ((
  globalThis as typeof globalThis & {
    __ascendantChartRuntime?: ReturnType<
      typeof ManagedRuntime.make<
        AstroParams.AstroParams | Ephemeris.Ephemeris,
        never
      >
    >;
  }
).__ascendantChartRuntime ??= ManagedRuntime.make(ChartLayer));

export { runtime };
