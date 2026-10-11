import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useChart } from "@/components/chart/context";
import { ChartAskChatGPTButton, ChartSavePdfButton } from "@/components/chart/actions";
import { ChartSignHouseCharts } from "@/components/chart/sign-house-chart";
import { ChartDashaTimelines } from "@/components/chart/dasha-timeline";
import { ChartKpCaption, ChartKpCuspTable, ChartKpTable } from "@/components/chart/kp-table";
import { ChartKpCircularChart } from "@/components/chart/kp-circular-chart";
import { signShortName } from "@/lib/chart";

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
    <Alert variant="destructive" className="shadow-none">
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
    <Tabs defaultValue="karakas">
      <TabsList className="max-w-full self-start overflow-x-auto">
        <TabsTrigger value="karakas">Chara Karakas</TabsTrigger>
        <TabsTrigger value="arudha">Arudha Pada</TabsTrigger>
        <TabsTrigger value="karakamsha">Karakamsha and Upapada</TabsTrigger>
        <TabsTrigger value="drishti">Drishti and Argala</TabsTrigger>
      </TabsList>
      <TabsContent value="karakas">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Planet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.jaimini.karakas.map((karaka) => (
              <TableRow key={karaka.role}>
                <TableCell>{karaka.role}</TableCell>
                <TableCell>{karaka.planet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="karakamsha">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Karakamsha</TableCell>
              <TableCell>
                {result.jaimini.karakamsha === "" ? "—" : result.jaimini.karakamsha}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Upapada</TableCell>
              <TableCell>{result.jaimini.upapada === "" ? "—" : result.jaimini.upapada}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="arudha">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>House</TableHead>
              <TableHead>Pada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.jaimini.arudha.map((entry) => (
              <TableRow key={entry.house}>
                <TableCell>{entry.house}</TableCell>
                <TableCell>{entry.pada === "" ? "—" : entry.pada}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="drishti">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Rashi Drishti on Lagna</TableCell>
              <TableCell>
                {result.jaimini.drishti.length > 0 ? result.jaimini.drishti.join(", ") : "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Supporting Argala</TableCell>
              <TableCell>
                {result.jaimini.argala.supporting.length > 0
                  ? result.jaimini.argala.supporting.join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Obstructing Argala</TableCell>
              <TableCell>
                {result.jaimini.argala.obstructing.length > 0
                  ? result.jaimini.argala.obstructing.join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Planet</TableHead>
          {result.sav.signs.map((sign) => (
            <TableHead key={sign}>{signShortName(sign)}</TableHead>
          ))}
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.sav.rows.map((row) => (
          <TableRow key={row.planet}>
            <TableCell>{row.planet}</TableCell>
            {row.points.map((points, index) => (
              <TableCell key={result.sav.signs[index]} className="tabular-nums">
                {points}
              </TableCell>
            ))}
            <TableCell className="tabular-nums">{row.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          {result.sav.signTotals.map((points, index) => (
            <TableCell key={result.sav.signs[index]} className="tabular-nums">
              {points}
            </TableCell>
          ))}
          <TableCell className="tabular-nums">{result.sav.total}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ChartSuccess() {
  const {
    state: { result },
  } = useChart();
  if (!result) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="chart">
        <TabsList className="max-w-full self-start overflow-x-auto">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="kp">KP Chart</TabsTrigger>
          <TabsTrigger value="dasha">Dasha</TabsTrigger>
          <TabsTrigger value="jaimini">Jaimini</TabsTrigger>
          <TabsTrigger value="sav">SAV</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <ChartSignHouseCharts />
        </TabsContent>
        <TabsContent value="kp">
          <div className="flex flex-col gap-4">
            <ChartKpCaption />
            <ChartKpCircularChart />
            <ChartKpTable />
            <ChartKpCuspTable />
          </div>
        </TabsContent>
        <TabsContent value="dasha">
          <ChartDashaTimelines />
        </TabsContent>
        <TabsContent value="jaimini">
          <ChartJaiminiTables />
        </TabsContent>
        <TabsContent value="sav">
          <ChartSavTable />
        </TabsContent>
      </Tabs>
      <Separator />
      <div className="flex flex-row gap-3">
        <ChartAskChatGPTButton />
        <ChartSavePdfButton />
      </div>
    </div>
  );
}

export function ChartResultSwitch() {
  const {
    state: { status },
  } = useChart();
  if (status === "calculating") {
    return <ChartCalculating />;
  }
  if (status === "failure") {
    return <ChartFailure />;
  }
  if (status === "success") {
    return <ChartSuccess />;
  }
  return null;
}
