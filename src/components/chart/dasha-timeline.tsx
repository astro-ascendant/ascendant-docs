import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import {
  findCurrentPeriodIndex,
  formatDashaDate,
  formatDashaDuration,
  type ChartDashaPeriod,
} from "@/lib/chart";
import { useChartSession } from "@/components/chart/context";
import { ChartQuote } from "@/components/chart/quote";

const dashaIntros: Record<string, string> = {
  Vimshottari:
    "Vimshottari breaks your life into planetary periods. The period running now is the planet steering your life, and this table shows when each hand on the wheel changes.",
  Chara:
    "Chara dasha treats your life as chapters, each owned by a zodiac sign. The sign in charge today shows the area of life in the spotlight right now.",
  Sthira:
    "Sthira dasha walks your chart through the fixed signs. It is the reading astrologers lean on when the question is about health, stability and how long something will last.",
};

function periodKey(period: ChartDashaPeriod): string {
  return `${period.mahadasha}-${period.start}`;
}

function AntardashaTable({
  period,
  now,
}: {
  period: ChartDashaPeriod;
  now: string;
}) {
  if (period.antardashas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No antardasha periods.</p>
    );
  }
  const current = findCurrentPeriodIndex(period.antardashas, now);
  return (
    <Table className="text-[11px] sm:text-sm [&_td]:px-1 [&_td]:py-2 [&_td]:text-center sm:[&_td]:px-3 sm:[&_td]:py-3 [&_th]:h-auto [&_th]:px-1 [&_th]:py-2 [&_th]:text-center sm:[&_th]:px-3 sm:[&_th]:py-3">
      <TableHeader>
        <TableRow>
          <TableHead>Antardasha</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody tone="muted">
        {period.antardashas.map((antar, index) => (
          <TableRow
            key={`${antar.antardasha}-${antar.start}`}
            tone={index === current ? "current" : "default"}
          >
            <TableCell>{antar.antardasha}</TableCell>
            <TableCell>{formatDashaDate(antar.start)}</TableCell>
            <TableCell>{formatDashaDate(antar.end)}</TableCell>
            <TableCell>{formatDashaDuration(antar.start, antar.end)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DashaSystemTable({
  periods,
  now,
}: {
  periods: ChartDashaPeriod[];
  now: string;
}) {
  const current = findCurrentPeriodIndex(periods, now);
  if (periods.length === 0) {
    return <p className="text-muted-foreground text-sm">No dasha periods.</p>;
  }
  return (
    <div className="flex flex-col">
      <div className="text-primary border-border/70 grid h-11 grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,1.35fr)_minmax(0,0.75fr)] items-center gap-2 border-b px-3 pr-8 text-center text-[11px] font-semibold whitespace-nowrap sm:h-12 sm:text-sm">
        <span>Mahadasha</span>
        <span>Start</span>
        <span>End</span>
        <span>Duration</span>
      </div>
      <Accordion
        defaultValue={current === -1 ? [] : [periodKey(periods[current]!)]}
        className="rounded-none border-0"
      >
        {periods.map((period, index) => {
          return (
            <AccordionItem key={periodKey(period)} value={periodKey(period)}>
              <AccordionTrigger className="items-center gap-1 px-3 py-3 text-xs hover:no-underline sm:text-sm **:data-[slot=accordion-trigger-icon]:size-4">
                <span
                  className={`grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,1.35fr)_minmax(0,0.75fr)] gap-2 whitespace-nowrap pr-1 text-center text-[11px] sm:text-sm ${
                    index === current
                      ? "font-semibold text-primary"
                      : "font-normal text-muted-foreground"
                  }`}
                >
                  <span>{period.mahadasha}</span>
                  <span>{formatDashaDate(period.start)}</span>
                  <span>{formatDashaDate(period.end)}</span>
                  <span>{formatDashaDuration(period.start, period.end)}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                {/* Full-bleed on phones: the panel's px-4 would squeeze the four
                    columns into a horizontal scroll that hides Duration. */}
                <div className="-mx-4 sm:mx-0">
                  <AntardashaTable period={period} now={now} />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function ChartDashaTimelines() {
  const {
    state: { result },
    clock,
  } = useChartSession();
  if (!result) {
    return null;
  }
  const now = clock();
  const systems = [
    { name: "Vimshottari", periods: result.dasha.vimshottari },
    { name: "Chara", periods: result.dasha.chara },
    { name: "Sthira", periods: result.dasha.sthira },
  ];
  return (
    <Tabs defaultValue="Vimshottari">
      <TabsList containerClassName="max-w-full self-start">
        {systems.map((system) => (
          <TabsTrigger key={system.name} value={system.name}>
            {system.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {systems.map((system) => (
        <TabsContent key={system.name} value={system.name} className="flex flex-col gap-4">
          <ChartQuote>{dashaIntros[system.name]}</ChartQuote>
          <DashaSystemTable periods={system.periods} now={now} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * Vimshottari periods for the KP chart. Same engine and same period maths as
 * the Dasha tab, but fed by the KP calculation's own Moon position, so the
 * nakshatra balance follows the KP ayanamsa.
 */
export function ChartKpDashaTimeline() {
  const {
    state: { result },
    clock,
  } = useChartSession();
  if (!result) {
    return null;
  }
  return (
    <DashaSystemTable periods={result.kp.dasha.vimshottari} now={clock()} />
  );
}
