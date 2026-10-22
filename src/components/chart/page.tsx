import { useState } from "react";
import { CalendarBlankIcon, ClockIcon, MapPinIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Chart } from "@/components/chart";
import { ChatGptIcon } from "@/components/chart/chatgpt-icon";
import { ChartDetailsEditor } from "@/components/chart/details-editor";
import { useChart } from "@/components/chart/context";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { findCurrentPeriodIndex } from "@/lib/chart";
import { formatTimeZoneLabel } from "@/lib/timezone";
import wordmark from "../../../assets/wordmark.webp";

function Wordmark() {
  return (
    <a
      href="/"
      aria-label="Ascendant home"
      className="focus-visible:ring-ring inline-flex shrink-0 items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <img src={wordmark} alt="Ascendant" width={973} height={200} className="h-6 w-auto" />
    </a>
  );
}

function formatLongDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value === "" ? "—" : value;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

/** 24-hour input to a 12-hour clock, e.g. 09:45 becomes 9:45 AM. */
function formatClockTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) {
    return value === "" ? "—" : value;
  }
  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours < 12 ? "AM" : "PM";
  const clock = hours % 12 === 0 ? 12 : hours % 12;
  return `${clock}:${minutes} ${suffix}`;
}

/** The offset the chart was cast against, e.g. UTC+05:30. */
function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const rest = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${rest}`;
}

/**
 * The local zone next to the offset it stands for, e.g. IST (UTC+05:30). Reads
 * as the offset alone when the zone lookup found nothing or the zone has no
 * abbreviation to show.
 */
function formatZoneHint(minutes: number, timeZone: string | null): string {
  const offset = formatUtcOffset(minutes);
  const label = timeZone === null ? null : formatTimeZoneLabel(timeZone);
  return label === null ? offset : `${label} (${offset})`;
}

/** One fact about the birth moment: leading icon, label for assistive tech, value. */
function MetaFact({
  icon: Icon,
  label,
  value,
  hint,
  title,
}: {
  icon: typeof CalendarBlankIcon;
  label: string;
  value: string;
  hint?: string;
  title?: string;
}) {
  return (
    <div className="flex max-w-full min-w-0 items-center gap-1.5">
      <Icon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
      <dt className="sr-only">{label}</dt>
      <dd className="text-muted-foreground truncate text-sm tabular-nums" title={title ?? value}>
        {value}
        {hint ? <span className="text-muted-foreground ms-1.5">{hint}</span> : null}
      </dd>
    </div>
  );
}

interface SummaryItem {
  label: string;
  value: string;
}

/** Headline facts for the band under the name, derived from the live result. */
function useChartSummary(): { items: SummaryItem[] } | null {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  const now = new Date().toISOString();
  const dashaIndex = findCurrentPeriodIndex(result.dasha.vimshottari, now);
  const currentDasha = dashaIndex === -1 ? null : (result.dasha.vimshottari[dashaIndex] ?? null);
  const d1 = result.divisions.find((division) => division.division === 1);
  const moon = d1?.placements.find((placement) => placement.body === "Moon") ?? null;

  return {
    items: [
      { label: "Ascendant", value: `${result.lagna.sign} ${result.lagna.degree}°` },
      { label: "Moon", value: moon ? `${moon.sign} ${moon.degree}°` : "—" },
      {
        label: "Star",
        value:
          moon && moon.star !== "" ? `${moon.star}${moon.pada ? ` · Pada ${moon.pada}` : ""}` : "—",
      },
      { label: "Mahadasha", value: currentDasha ? currentDasha.mahadasha : "—" },
    ],
  };
}

/** Hairline-divided stat row: one grid, space and a single divider line. */
function KpiStrip({ items, className }: { items: SummaryItem[]; className?: string }) {
  return (
    <dl
      className={cn(
        "border-border/70 bg-border/70 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-background min-w-0 px-4 py-3">
          <dt className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
            {item.label}
          </dt>
          <dd className="text-foreground mt-1 truncate text-sm tabular-nums" title={item.value}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * On phones the result tabs float at the bottom edge of the screen, where a
 * thumb actually reaches, instead of sitting above the analysis. Desktop keeps
 * the in-flow bar. Driven by the same breakpoint as the birth-details overlay
 * so the two can never disagree.
 */
const MOBILE_TAB_LIST =
  "fixed inset-x-3 bottom-3 z-40 flex w-auto max-w-none rounded-full border border-border/70 bg-muted/90 p-1 shadow-lg backdrop-blur [&>[data-slot=tabs-trigger]]:px-2 [&>[data-slot=tabs-trigger]]:text-xs";

/**
 * The chart generator, outside the docs shell. Opens as a report on one
 * person (headline facts, then the tabbed analysis) with the birth-details
 * form behind one action, in a dialog on desktop and a drawer on mobile.
 */
export function ChartPage() {
  const {
    state: { birth, selectedPlace, placeZone, status },
  } = useChart();
  const summary = useChartSummary();
  const isMobile = useIsMobile();
  const [editorOpen, setEditorOpen] = useState(false);
  const hasSubject = status !== "empty";
  const placeLabel =
    selectedPlace !== null
      ? [selectedPlace.name, selectedPlace.region].filter(Boolean).join(", ")
      : birth.place.split(",")[0]?.trim() || "—";
  const placeTitle = birth.place !== "" && birth.place !== placeLabel ? birth.place : undefined;

  return (
    <div className="bg-background text-foreground relative min-h-[100dvh]">
      <a
        href="#content"
        className="focus-visible:ring-ring sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-1.5 focus-visible:text-sm focus-visible:font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <div aria-hidden="true" className="paper-grain" />

      <header className="border-border/70 border-b">
        <div className="mx-auto flex w-full max-w-173 items-center gap-3 px-4 py-2 sm:py-3 lg:max-w-4xl">
          <Wordmark />
          <nav aria-label="Site" className="ms-auto flex items-center">
            <a
              href="/docs"
              className="text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1.5 text-sm transition-colors"
            >
              Docs
            </a>
          </nav>
        </div>
      </header>

      <section className="border-border/70 bg-card/40 mx-4 my-4 rounded-xl border sm:mx-0 sm:my-0 sm:rounded-none sm:border-x-0 sm:border-t-0">
        <div className="mx-auto w-full max-w-173 px-4 py-8 lg:max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                {hasSubject ? birth.name || "Untitled chart" : "Birth chart"}
              </h1>
              {hasSubject ? (
                <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <MetaFact
                    icon={CalendarBlankIcon}
                    label="Birth date"
                    value={formatLongDate(birth.date)}
                  />
                  <MetaFact
                    icon={ClockIcon}
                    label="Birth time"
                    value={formatClockTime(birth.time)}
                    hint={formatZoneHint(birth.utcOffsetMinutes, placeZone)}
                  />
                  <MetaFact
                    icon={MapPinIcon}
                    label="Birth place"
                    value={placeLabel}
                    title={placeTitle}
                  />
                </dl>
              ) : (
                <p className="text-muted-foreground mt-2 max-w-prose text-sm text-pretty">
                  Create your birth chart and uncover personalised insights about your career,
                  relationships, timing, and life patterns with{" "}
                  <span className="text-primary font-semibold whitespace-nowrap">
                    <ChatGptIcon
                      aria-hidden="true"
                      className="me-1 inline-block size-4 align-[-0.125em]"
                    />
                    ChatGPT
                  </span>{" "}
                  using the{" "}
                  <code className="bg-muted rounded-[0.3rem] px-[0.3rem] py-[0.15rem] font-mono text-[0.9em]">
                    /ascendant
                  </code>{" "}
                  astrology skill.
                </p>
              )}
            </div>

            {hasSubject ? (
              <Button type="button" onClick={() => setEditorOpen(true)}>
                <PencilSimpleIcon data-icon="inline-start" aria-hidden="true" />
                Edit details
              </Button>
            ) : null}
          </div>

          {summary ? <KpiStrip items={summary.items} className="mt-8" /> : null}
        </div>
      </section>

      <main id="content" className="w-full">
        <div className="mx-auto w-full max-w-173 px-4 py-8 sm:py-10 lg:max-w-4xl">
          {hasSubject ? (
            <>
              <Chart.ResultSwitch tabListClassName={isMobile ? MOBILE_TAB_LIST : undefined} />
              {/* Clearance for the floating tab bar; only where it floats. */}
              {isMobile ? <div aria-hidden="true" className="h-16" /> : null}
            </>
          ) : (
            <section className="border-border/70 bg-card/40 flex flex-col items-start gap-4 rounded-xl border p-6 sm:p-8">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-heading text-base font-medium">No chart yet?</h2>
                <p className="text-muted-foreground max-w-prose text-sm text-pretty">
                  Enter a birth date, time and place to generate a Rashi chart, Navamsha chart, KP
                  chart, Vimshottari dasha, Jaimini karakas and Sarvashtakavarga.
                </p>
              </div>
              <Button type="button" onClick={() => setEditorOpen(true)}>
                Enter birth details
              </Button>
            </section>
          )}
        </div>
      </main>

      <ChartDetailsEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  );
}
