import { CostarChart } from "@astrologer/react-chart";
import "@astrologer/react-chart/dist/index.css";
import type { ChartData } from "@astrologer/astro-core";
import { useMemo } from "react";
import { buildCostarChartData } from "@/lib/costar-chart-data";
import { useChartSession } from "@/components/chart/context";

const SIZE = 600;
const CENTER = SIZE / 2;
const HOUSE_NUMBER_RADIUS = 192;
const ASC_INNER_RADIUS = 196;
const ASC_OUTER_RADIUS = 250;

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function point(angle: number, radius: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [
    CENTER + radius * Math.cos(radians),
    CENTER - radius * Math.sin(radians),
  ];
}

/**
 * Extra marks the library's Co-Star layout omits: house numbers on the inner
 * rim and an Ascendant marker on the left edge. The wheel is rotated so the
 * first cusp always sits at 180°, which makes the Ascendant marker static.
 */
function WheelMarks({ data }: { data: ChartData }) {
  const rotation = 180 - data.angles.Asc;
  const houses = [...data.houses].sort((a, b) => a.house - b.house);
  const numbers = houses.map((house, index) => {
    const next = houses[(index + 1) % houses.length];
    const span =
      next === undefined
        ? 30
        : normalize(next.longitude - house.longitude) || 30;
    const [x, y] = point(
      normalize(house.longitude + span / 2 + rotation),
      HOUSE_NUMBER_RADIUS,
    );
    return { house: house.house, x, y };
  });

  const [ascOuterX, ascOuterY] = point(180, ASC_INNER_RADIUS);
  const [ascTipX, ascTipY] = point(180, ASC_OUTER_RADIUS);
  const [ascLabelX, ascLabelY] = point(180, 174);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {numbers.map((entry) => (
        <text
          key={entry.house}
          x={entry.x}
          y={entry.y}
          className="kp-chart-house-number"
        >
          {entry.house}
        </text>
      ))}
      <line
        x1={ascOuterX}
        y1={ascOuterY}
        x2={ascTipX}
        y2={ascTipY}
        className="kp-chart-asc-line"
      />
      <text x={ascLabelX} y={ascLabelY} className="kp-chart-asc-label">
        ASC
      </text>
    </svg>
  );
}

/**
 * Co-Star style wheel: curved sign names on the outer band, monochrome planet
 * glyphs on the cusp ring, and the Ascendant marked on the left.
 */
function CircularWheel({
  data,
}: {
  data: NonNullable<ReturnType<typeof buildCostarChartData>>;
}) {
  const spoken = useMemo(() => {
    const bodies = data.bodies
      .map(
        (body) =>
          `${body.name}${body.isRetrograde ? " retrograde" : ""} ${body.sign} ${body.degree.toFixed(1)} degrees`,
      )
      .join(". ");
    const asc = data.houses.find((house) => house.house === 1);
    return `Ascendant ${asc?.sign ?? ""} ${asc?.degree.toFixed(1) ?? ""} degrees. ${bodies}`;
  }, [data]);

  return (
    <div
      role="img"
      aria-label={`Circular chart. ${spoken}`}
      className="kp-costar-chart relative mx-auto w-full max-w-xl"
    >
      <CostarChart
        data={data}
        width={SIZE}
        height={SIZE}
        className="h-auto w-full"
      />
      <WheelMarks data={data} />
    </div>
  );
}

export function ChartKpCircularChart() {
  const {
    state: { result },
  } = useChartSession();
  const data = useMemo(
    () => (result ? buildCostarChartData(result) : null),
    [result],
  );
  if (!data) {
    return null;
  }
  return <CircularWheel data={data} />;
}
