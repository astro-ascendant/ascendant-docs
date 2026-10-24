import { CostarChart } from "@astrologer/react-chart";
import "@astrologer/react-chart/dist/index.css";
import type { BodyId, ChartData } from "@astrologer/astro-core";
import { useMemo } from "react";
import { buildCostarChartData } from "@/lib/costar-chart-data";
import { useChartSession } from "@/components/chart/context";

const SIZE = 600;
const CENTER = SIZE / 2;
const SIGN_RING_OUTER = 290;
const SIGN_RING_INNER = 250;
const HOUSE_NUMBER_RADIUS = 192;
const HOUSE_LINE_INNER = 201;
/** Outer edge of the house field, where the sign band's inner ring sits. */
const HOUSE_LINE_OUTER = SIGN_RING_INNER;
const ASC_INNER_RADIUS = 196;
const ASC_OUTER_RADIUS = 250;
const PLANET_LABEL_RADIUS = 223;
const PLANET_TICK_INNER = 240;
const PLANET_TICK_OUTER = 250;

/** Two-letter planet labels, the convention used by the report's tables. */
const ABBREVIATIONS: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  TrueNode: "Ra",
  SouthNode: "Ke",
};

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Forward distance from `from` to `to` along the zodiac, in [0, 360). */
function forward(from: number, to: number): number {
  return normalize(to - from);
}

function point(angle: number, radius: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [
    CENTER + radius * Math.cos(radians),
    CENTER - radius * Math.sin(radians),
  ];
}

interface SpreadBody {
  readonly id: BodyId;
  readonly original: number;
  readonly current: number;
}

/**
 * The library nudges overlapping glyphs apart while its tick stays on the true
 * longitude. The letters are wider than glyphs, so the same relaxation runs
 * here with a slightly larger minimum separation, and pushes labels off cusps.
 */
function spreadBodies(
  bodies: ChartData["bodies"],
  cusps: readonly { longitude: number }[],
): SpreadBody[] {
  const list = [...bodies]
    .sort((a, b) => a.longitude - b.longitude)
    .map((body) => ({
      id: body.id,
      original: body.longitude,
      current: body.longitude,
    }));
  const count = list.length;
  const minSeparation = 7.5;
  const cuspGap = 4;

  for (let pass = 0; pass < 100; pass += 1) {
    let moved = false;

    for (let index = 0; index < count; index += 1) {
      const body = list[index];
      const next = list[(index + 1) % count];
      if (!body || !next) {
        continue;
      }
      const gap = forward(body.current, next.current);
      if (gap < minSeparation - 1e-3) {
        const push = (minSeparation - gap) / 2 + 0.05;
        body.current = normalize(body.current - push);
        next.current = normalize(next.current + push);
        moved = true;
      }
    }

    for (const body of list) {
      for (const cusp of cusps) {
        let distance = Math.abs(body.current - cusp.longitude);
        if (distance > 180) {
          distance = 360 - distance;
        }
        if (distance < cuspGap) {
          const ahead = forward(cusp.longitude, body.current) < 180;
          const push = cuspGap - distance + 0.1;
          body.current = normalize(
            ahead ? body.current + push : body.current - push,
          );
          moved = true;
        }
      }
    }

    for (let index = 0; index < count; index += 1) {
      const body = list[index];
      const next = list[(index + 1) % count];
      if (!body || !next) {
        continue;
      }
      if (forward(body.current, next.current) > 300) {
        next.current = normalize(body.current + minSeparation);
        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return list;
}

/**
 * Marks the library's Co-Star layout omits: two-letter planet labels with
 * longitude ticks, house numbers on the inner rim, and the Ascendant line.
 * The wheel is rotated so the first cusp always sits at 180°, which makes the
 * Ascendant marker static.
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

  /**
   * The library stops each cusp at r=245, five units short of the sign band's
   * inner circle, leaving a gap. Redraw them so they meet that circle.
   */
  const cusps = houses.map((house) => {
    const angle = normalize(house.longitude + rotation);
    const [x1, y1] = point(angle, HOUSE_LINE_INNER);
    const [x2, y2] = point(angle, HOUSE_LINE_OUTER);
    return {
      house: house.house,
      angle: [1, 4, 7, 10].includes(house.house),
      x1,
      y1,
      x2,
      y2,
    };
  });

  const byId = new Map(data.bodies.map((body) => [body.id, body]));
  const planets = spreadBodies(data.bodies, houses).flatMap((entry) => {
    const body = byId.get(entry.id);
    const label = ABBREVIATIONS[entry.id];
    if (!body || label === undefined) {
      return [];
    }
    const originalAngle = normalize(entry.original + rotation);
    const [tickX1, tickY1] = point(originalAngle, PLANET_TICK_OUTER);
    const [tickX2, tickY2] = point(originalAngle, PLANET_TICK_INNER);
    const [labelX, labelY] = point(
      normalize(entry.current + rotation),
      PLANET_LABEL_RADIUS,
    );
    return [
      {
        id: entry.id,
        label,
        retrograde: body.isRetrograde,
        tickX1,
        tickY1,
        tickX2,
        tickY2,
        labelX,
        labelY,
      },
    ];
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
      {/*
        The library's sign band is one almost-closed path, so its stroke leaves
        a stray radial seam at 0°. Redraw the band as two plain circles.
      */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={SIGN_RING_OUTER}
        className="kp-chart-sign-ring"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={SIGN_RING_INNER}
        className="kp-chart-sign-ring"
      />
      {cusps.map((cusp) => (
        <line
          key={cusp.house}
          x1={cusp.x1}
          y1={cusp.y1}
          x2={cusp.x2}
          y2={cusp.y2}
          className={
            cusp.angle ? "kp-chart-cusp-line angle" : "kp-chart-cusp-line"
          }
        />
      ))}
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
      {planets.map((planet) => (
        <g key={planet.id}>
          <line
            x1={planet.tickX1}
            y1={planet.tickY1}
            x2={planet.tickX2}
            y2={planet.tickY2}
            className="kp-chart-planet-tick"
          />
          <text
            x={planet.labelX}
            y={planet.labelY}
            className="kp-chart-planet-label"
          >
            {planet.label}
            {planet.retrograde ? (
              <tspan className="kp-chart-planet-retrograde" dy="-4">
                R
              </tspan>
            ) : null}
          </text>
        </g>
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
 * Co-Star style wheel: curved sign names on the outer band, two-letter planet
 * labels on the cusp ring, and the Ascendant marked on the left.
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
