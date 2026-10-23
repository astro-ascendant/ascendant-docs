import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChartSession } from "@/components/chart/context";
import { formatSignifyingHouses } from "@/lib/chart";
import { formatLongitude } from "@/lib/longitude";
import { ChartCode, ChartQuote } from "@/components/chart/quote";

export function ChartKpCaption() {
  const {
    state: { result },
  } = useChartSession();
  if (!result) {
    return null;
  }
  return (
    <ChartQuote>
      Krishnamurthi Paddhathi is a modern astrological system designed to
      analyse charts with greater precision. It uses the{" "}
      <ChartCode>{result.kp.astroParams.ayanamsa}</ChartCode> ayanamsa and the{" "}
      <ChartCode>{result.kp.astroParams.houseSystem}</ChartCode> cusp-based
      house system. While it can be applied to a wide range of astrological
      questions, it is particularly effective for questions involving timing.
    </ChartQuote>
  );
}

export function ChartKpCuspTable() {
  const {
    state: { result },
  } = useChartSession();
  if (!result || result.kp.cusps.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>House</TableHead>
            <TableHead>Sign</TableHead>
            <TableHead>Cusp</TableHead>
            <TableHead>Sign Lord</TableHead>
            <TableHead>Star Lord</TableHead>
            <TableHead>Sub Lord</TableHead>
            <TableHead>Sub-Sub Lord</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody tone="muted">
          {result.kp.cusps.map((cusp) => (
            <TableRow key={cusp.house}>
              <TableCell>{cusp.house}</TableCell>
              <TableCell>{cusp.sign === "" ? "—" : cusp.sign}</TableCell>
              <TableCell>
                {cusp.longitude === null
                  ? "—"
                  : formatLongitude(cusp.longitude)}
              </TableCell>
              <TableCell>
                {cusp.signLord === "" ? "—" : cusp.signLord}
              </TableCell>
              <TableCell>
                {cusp.starLord === "" ? "—" : cusp.starLord}
              </TableCell>
              <TableCell>{cusp.subLord === "" ? "—" : cusp.subLord}</TableCell>
              <TableCell>
                {cusp.subSubLord === "" ? "—" : cusp.subSubLord}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ChartKpTable() {
  const {
    state: { result },
  } = useChartSession();
  if (!result) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Body</TableHead>
            <TableHead>Sign Lord</TableHead>
            <TableHead>Star Lord</TableHead>
            <TableHead>Sub Lord</TableHead>
            <TableHead>Signifying Houses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody tone="muted">
          {result.kp.rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.signLord === "" ? "—" : row.signLord}</TableCell>
              <TableCell>{row.starLord === "" ? "—" : row.starLord}</TableCell>
              <TableCell>{row.subLord === "" ? "—" : row.subLord}</TableCell>
              <TableCell>
                {formatSignifyingHouses(row.signifyingHouses)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
