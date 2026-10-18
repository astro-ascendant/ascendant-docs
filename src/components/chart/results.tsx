import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";
import { useChart } from "@/components/chart/context";
import { ChartQuote } from "@/components/chart/quote";
import { ChartAskChatGPTButton, ChartSavePdfButton } from "@/components/chart/actions";
import { ChartSignHouseCharts } from "@/components/chart/sign-house-chart";
import { ChartDashaTimelines } from "@/components/chart/dasha-timeline";
import { ChartKpCaption, ChartKpCuspTable, ChartKpTable } from "@/components/chart/kp-table";
import { ChartKpCircularChart } from "@/components/chart/kp-circular-chart";

function ChartCalculating() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Calculating planetary positions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </CardContent>
    </Card>
  );
}

function ChartFailure() {
  const {
    state: { errors },
  } = useChart();
  return (
    <Alert variant="destructive">
      <AlertTitle>Calculation did not complete</AlertTitle>
      <AlertDescription>
        {errors.length > 0
          ? errors.join(" ")
          : "Unable to calculate the chart. Check your connection and try again."}
      </AlertDescription>
    </Alert>
  );
}

function ChartJaiminiTables() {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <section className="border-border/70 bg-card/40 flex flex-col gap-4 rounded-xl border p-6">
        <h3 className="font-heading text-base font-medium">Chara Karakas</h3>
        <ChartQuote>
          Chara Karakas introduce the cast of your chart. The planet furthest along in its journey
          becomes your Atmakaraka, representing your own soul, and the next strongest steps in as
          your advisor.
        </ChartQuote>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Planet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody tone="muted">
            {result.jaimini.karakas.map((karaka) => (
              <TableRow key={karaka.role}>
                <TableCell>{karaka.role}</TableCell>
                <TableCell>{karaka.planet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section className="border-border/70 bg-card/40 flex flex-col gap-4 rounded-xl border p-6">
        <h3 className="font-heading text-base font-medium">Arudha Pada</h3>
        <ChartQuote>
          Arudha pada shows how you are seen. A house says what is true in your life, while its
          arudha says what the world believes about it.
        </ChartQuote>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>House</TableHead>
              <TableHead>Pada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody tone="muted">
            {result.jaimini.arudha.map((entry) => (
              <TableRow key={entry.house}>
                <TableCell>{entry.house}</TableCell>
                <TableCell>{entry.pada === "" ? "—" : entry.pada}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section className="border-border/70 bg-card/40 flex flex-col gap-4 rounded-xl border p-6">
        <h3 className="font-heading text-base font-medium">Karakamsha and Upapada</h3>
        <ChartQuote>
          Karakamsha points to what you came here to become: it is read for purpose and livelihood.
          Upapada is about the person you share life with, so astrologers read it first for
          marriage.
        </ChartQuote>
        <Table>
          <TableBody tone="muted">
            <TableRow>
              <TableHead>Karakamsha</TableHead>
              <TableCell>
                {result.jaimini.karakamsha === "" ? "—" : result.jaimini.karakamsha}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Upapada</TableHead>
              <TableCell>{result.jaimini.upapada === "" ? "—" : result.jaimini.upapada}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className="border-border/70 bg-card/40 flex flex-col gap-4 rounded-xl border p-6">
        <h3 className="font-heading text-base font-medium">Drishti and Argala</h3>
        <ChartQuote>
          Drishti shows which parts of your chart are in conversation with each other. Argala tells
          you who is holding a door open for a house and who is standing in its doorway.
        </ChartQuote>
        <Table>
          <TableBody tone="muted">
            <TableRow>
              <TableHead>Rashi Drishti on Lagna</TableHead>
              <TableCell>
                {result.jaimini.drishti.length > 0 ? result.jaimini.drishti.join(", ") : "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Supporting Argala</TableHead>
              <TableCell>
                {result.jaimini.argala.supporting.length > 0
                  ? result.jaimini.argala.supporting.join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Obstructing Argala</TableHead>
              <TableCell>
                {result.jaimini.argala.obstructing.length > 0
                  ? result.jaimini.argala.obstructing.join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function ChartKpTabs() {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  return (
    <Tabs defaultValue="wheel">
      <TabsList className="max-w-full self-start overflow-x-auto">
        <TabsTrigger value="wheel">Circular Chart</TabsTrigger>
        <TabsTrigger value="planets">Planets</TabsTrigger>
        <TabsTrigger value="cusps">Cusps</TabsTrigger>
      </TabsList>
      <TabsContent value="wheel">
        <ChartKpCircularChart />
      </TabsContent>
      <TabsContent value="planets">
        <ChartKpTable />
      </TabsContent>
      <TabsContent value="cusps">
        <ChartKpCuspTable />
      </TabsContent>
    </Tabs>
  );
}

function ChartSavTable() {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  const peakByPlanet = new Map(
    result.sav.rows.map((row) => [row.planet, Math.max(...row.points)]),
  );
  const troughByPlanet = new Map(
    result.sav.rows.map((row) => [row.planet, Math.min(...row.points)]),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sign</TableHead>
          {result.sav.rows.map((row) => (
            <TableHead key={row.planet}>{row.planet}</TableHead>
          ))}
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody tone="muted">
        {result.sav.signs.map((sign, signIndex) => (
          <TableRow key={sign}>
            <TableCell tone="muted">{sign}</TableCell>
            {result.sav.rows.map((row) => {
              const value = row.points[signIndex] ?? 0;
              const tone =
                value === peakByPlanet.get(row.planet)
                  ? "primary"
                  : value === troughByPlanet.get(row.planet)
                    ? "destructive"
                    : "muted";
              return (
                <TableCell key={row.planet} tone={tone} className="tabular-nums">
                  {value}
                </TableCell>
              );
            })}
            <TableCell tone="muted" className="tabular-nums">
              {result.sav.signTotals[signIndex]}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          {result.sav.rows.map((row) => (
            <TableCell key={row.planet} tone="muted" className="tabular-nums">
              {row.total}
            </TableCell>
          ))}
          <TableCell tone="muted" className="tabular-nums">
            {result.sav.total}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ChartSuccess({ tabListClassName }: { tabListClassName?: string }) {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="chart">
        <TabsList className={cn("max-w-full self-start overflow-x-auto", tabListClassName)}>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="kp">KP Chart</TabsTrigger>
          <TabsTrigger value="dasha">Dasha</TabsTrigger>
          <TabsTrigger value="jaimini">Jaimini</TabsTrigger>
          <TabsTrigger value="sav">SAV</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <h2 className="sr-only">Rashi and Navamsha charts</h2>
          <ChartSignHouseCharts />
        </TabsContent>
        <TabsContent value="kp">
          <div className="flex flex-col gap-4">
            <h2 className="sr-only">KP chart</h2>
            <ChartKpCaption />
            <ChartKpTabs />
          </div>
        </TabsContent>
        <TabsContent value="dasha">
          <h2 className="sr-only">Dasha periods</h2>
          <ChartDashaTimelines />
        </TabsContent>
        <TabsContent value="jaimini">
          <h2 className="sr-only">Jaimini</h2>
          <ChartJaiminiTables />
        </TabsContent>
        <TabsContent value="sav">
          <h2 className="sr-only">Sarvashtakavarga</h2>
          <ChartQuote>
            SAV scores each sign by how much support it gives your planets. The highlighted numbers
            mark the signs that back you up most, and the dimmed ones show where you carry the
            weight yourself. In red: the sign where that planet runs weakest.
          </ChartQuote>
          <ChartSavTable />
        </TabsContent>
      </Tabs>
      <div className="flex flex-row gap-3">
        <ChartAskChatGPTButton />
        <ChartSavePdfButton />
      </div>
    </div>
  );
}

export function ChartResultSwitch({ tabListClassName }: { tabListClassName?: string } = {}) {
  const {
    state: { status },
  } = useChart();
  return (
    <div role="status">
      {status === "calculating" ? (
        <ChartCalculating />
      ) : status === "failure" ? (
        <ChartFailure />
      ) : status === "success" ? (
        <ChartSuccess tabListClassName={tabListClassName} />
      ) : null}
    </div>
  );
}
