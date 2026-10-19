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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  findCurrentPeriodIndex,
  formatDashaDate,
  formatDashaDuration,
  type ChartDashaPeriod,
} from "@/lib/chart";
import { useChart } from "@/components/chart/context";
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

function AntardashaTable({ period, now }: { period: ChartDashaPeriod; now: string }) {
  if (period.antardashas.length === 0) {
    return <p className="text-muted-foreground text-sm">No antardasha periods.</p>;
  }
  const current = findCurrentPeriodIndex(period.antardashas, now);
  return (
    <Table>
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

function DashaSystemTable({ periods, now }: { periods: ChartDashaPeriod[]; now: string }) {
  const current = findCurrentPeriodIndex(periods, now);
  if (periods.length === 0) {
    return <p className="text-muted-foreground text-sm">No dasha periods.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="text-primary grid h-12 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 whitespace-nowrap px-3 pr-8 text-sm font-semibold">
        <span>Mahadasha</span>
        <span>Start</span>
        <span>End</span>
        <span>Duration</span>
      </div>
      <Accordion
        defaultValue={current === -1 ? [] : [periodKey(periods[current]!)]}
        className="border-0"
      >
        {periods.map((period, index) => {
          return (
            <AccordionItem key={periodKey(period)} value={periodKey(period)}>
              <AccordionTrigger className="items-center gap-1 px-3 py-3 text-sm hover:no-underline **:data-[slot=accordion-trigger-icon]:size-4">
                <span
                  className={`grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 whitespace-nowrap pr-1 text-left text-sm ${
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
                <AntardashaTable period={period} now={now} />
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
  } = useChart();
  if (!result) {
    return null;
  }
  const now = new Date().toISOString();
  const systems = [
    { name: "Vimshottari", periods: result.dasha.vimshottari },
    { name: "Chara", periods: result.dasha.chara },
    { name: "Sthira", periods: result.dasha.sthira },
  ];
  return (
    <Tabs defaultValue="Vimshottari">
      <TabsList className="max-w-full self-start overflow-x-auto">
        {systems.map((system) => (
          <TabsTrigger key={system.name} value={system.name}>
            {system.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {systems.map((system) => (
        <TabsContent key={system.name} value={system.name}>
          <ChartQuote>{dashaIntros[system.name]}</ChartQuote>
          <DashaSystemTable periods={system.periods} now={now} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
