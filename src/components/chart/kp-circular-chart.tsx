import { useMemo } from "react";
import {
  buildKpWheelView,
  circularMidAngle,
  fixedZodiacAngleFor,
  type KpWheelView,
} from "@/lib/chart-view";
import { signShortName } from "@/lib/chart";
import { useChartSession } from "@/components/chart/context";

const SIZE = 500;
const CENTER = SIZE / 2;
const OUTER_R = 242;
const PLANET_BAND_INNER = 190;
const DIVIDER_R = 150;
const HUB_R = 96;
const SIGN_LABEL_R = 176;
const PLANET_TICK_INNER = PLANET_BAND_INNER + 2;
const PLANET_TICK_TOP = 206;
const PLANET_LABEL_R = 212;
const MIN_LABEL_GAP = 12;
const HOUSE_NUM_R = 130;
const CUSP_DEG_R = 123;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function point(angle: number, radius: number): [number, number] {
  return [
    CENTER + radius * Math.cos(toRadians(angle)),
    CENTER - radius * Math.sin(toRadians(angle)),
  ];
}

/** Fixed signs: Aries at the top. Houses and planets rotate within the frame. */
function angleFor(longitude: number): number {
  return fixedZodiacAngleFor(longitude);
}

/** Spread label angles so neighbours keep a minimum gap (wraps around 0°). */
export function spreadLabelAngles(angles: number[]): number[] {
  const items = angles.map((angle, index) => ({ angle, index }));
  for (let iter = 0; iter < 100; iter += 1) {
    items.sort((a, b) => a.angle - b.angle);
    let moved = false;
    for (let i = 0; i < items.length; i += 1) {
      const current = items[i];
      const next = items[(i + 1) % items.length];
      if (current === undefined || next === undefined) {
        continue;
      }
      const gap = (((next.angle - current.angle) % 360) + 360) % 360;
      if (gap < MIN_LABEL_GAP) {
        const push = (MIN_LABEL_GAP - gap) / 2;
        current.angle = (((current.angle - push) % 360) + 360) % 360;
        next.angle = (next.angle + push) % 360;
        moved = true;
      }
    }
    if (!moved) {
      break;
    }
  }
  const spread: number[] = Array.from({ length: angles.length }, () => 0);
  for (const item of items) {
    spread[item.index] = item.angle;
  }
  return spread as number[];
}

function midAngle(a: number, b: number): number {
  return circularMidAngle(a, b);
}

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function CircularWheel({ chart }: { chart: KpWheelView }) {
  const geometry = useMemo(() => {
    const signAngles = SIGNS.map((_, index) => angleFor(index * 30));
    const byHouse = [...chart.cusps].sort((a, b) => a.house - b.house);
    const houses = byHouse.map((cusp, i) => {
      const start = angleFor(cusp.longitude);
      const next = byHouse[(i + 1) % byHouse.length];
      const end =
        next && next.house !== cusp.house
          ? angleFor(next.longitude)
          : (start + 30) % 360;
      return {
        cusp,
        angle: start,
        mid: midAngle(start, end ?? (start + 30) % 360),
      };
    });
    const sortedPlanets = [...chart.planets].sort(
      (a, b) => a.longitude - b.longitude,
    );
    const labelAngles = spreadLabelAngles(
      sortedPlanets.map((planet) => angleFor(planet.longitude)),
    );
    const planets = sortedPlanets.map((planet, i) => ({
      planet,
      angle: angleFor(planet.longitude),
      labelAngle: labelAngles[i] ?? angleFor(planet.longitude),
    }));
    return { signAngles, houses, planets };
  }, [chart]);

  const spoken = [
    `Ascendant ${chart.lagnaSign} ${chart.lagnaDegree}`,
    ...chart.cusps.map(
      (cusp) => `house ${cusp.house} cusp ${cusp.sign} ${cusp.degree}`,
    ),
    ...chart.planets.map(
      (planet) =>
        `${planet.body}${planet.retrograde ? " retrograde" : ""} ${planet.degree}`,
    ),
  ].join(". ");

  return (
    <div
      role="img"
      aria-label={`KP circular chart. ${spoken}`}
      className="mx-auto w-full max-w-xl"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={PLANET_BAND_INNER}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={DIVIDER_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={HUB_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
        {geometry.signAngles.map((angle, index) => {
          const [x1, y1] = point(angle, DIVIDER_R);
          const [x2, y2] = point(angle, PLANET_BAND_INNER);
          const mid = midAngle(
            angle,
            geometry.signAngles[(index + 1) % 12] ?? angle,
          );
          const [lx, ly] = point(mid, SIGN_LABEL_R);
          return (
            <g key={SIGNS[index]}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {signShortName(SIGNS[index] ?? "")}
              </text>
            </g>
          );
        })}
        {geometry.houses.map(({ cusp, angle, mid }) => {
          const [x1, y1] = point(angle, HUB_R);
          const [x2, y2] = point(angle, DIVIDER_R);
          const [nx, ny] = point(mid, HOUSE_NUM_R);
          const [dx, dy] = point(angle, CUSP_DEG_R);
          return (
            <g key={cusp.house}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--foreground)"
                strokeWidth={cusp.house === 1 ? 2 : 1}
                opacity={cusp.house === 1 ? 0.9 : 0.45}
              />
              <text
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {`H${cusp.house}`}
              </text>
              <text
                x={dx}
                y={dy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fill="var(--muted-foreground)"
                stroke="var(--background)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {cusp.degree}
              </text>
            </g>
          );
        })}
        {geometry.planets.map(({ planet, angle, labelAngle }) => {
          const [x1, y1] = point(angle, PLANET_TICK_INNER);
          const [x2, y2] = point(angle, PLANET_TICK_TOP);
          const [x, y] = point(labelAngle, PLANET_LABEL_R);
          const spread =
            Math.abs((((labelAngle - angle) % 360) + 360) % 360) > 0.5;
          return (
            <g key={`${planet.body}-${planet.longitude}`}>
              <title>{`${planet.body} ${planet.degree}${planet.retrograde ? " retrograde" : ""}`}</title>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--foreground)"
                strokeWidth={1.5}
                opacity={0.65}
              />
              {spread ? (
                <line
                  x1={x2}
                  y1={y2}
                  x2={x}
                  y2={y}
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                  opacity={0.6}
                />
              ) : null}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fill="var(--foreground)"
                stroke="var(--background)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {`${planet.short}${planet.retrograde ? " (r)" : ""} ${planet.degree}`}
              </text>
            </g>
          );
        })}
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={700}
          fill="var(--foreground)"
        >
          KP
        </text>
        <text
          x={CENTER}
          y={CENTER + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fill="var(--muted-foreground)"
        >
          {`As ${chart.lagnaSign} ${chart.lagnaDegree}`}
        </text>
      </svg>
    </div>
  );
}

export function ChartKpCircularChart() {
  const {
    state: { result },
  } = useChartSession();
  if (!result) {
    return null;
  }
  const chart = buildKpWheelView({
    kp: result.kp,
    d1: result.divisions.find((entry) => entry.division === 1),
  });
  if (!chart) {
    return null;
  }
  return <CircularWheel chart={chart} />;
}
