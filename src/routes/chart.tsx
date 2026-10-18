import { createFileRoute } from "@tanstack/react-router";
import { Chart } from "@/components/chart";
import { ChartPage } from "@/components/chart/page";

export const Route = createFileRoute("/chart")({
  component: ChartRoute,
  head: () => ({
    meta: [
      { title: "Calculate Birth Chart - Ascendant" },
      {
        name: "description",
        content:
          "Calculate your birth chart online for free. Enter a birth date, time, and place to get your Rashi chart, Navamsha, Vimshottari Dasha, and Jaimini karakas.",
      },
      {
        property: "og:title",
        content: "Calculate Birth Chart - Ascendant",
      },
      {
        property: "og:description",
        content:
          "Calculate your birth chart online for free. Enter a birth date, time, and place to get your Rashi chart, Navamsha, Vimshottari Dasha, and Jaimini karakas.",
      },
    ],
  }),
});

function ChartRoute() {
  return (
    <Chart.Provider>
      <ChartPage />
    </Chart.Provider>
  );
}
