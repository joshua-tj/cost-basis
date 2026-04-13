import { useSnapshot } from "valtio";
import { store, REST_GROUP, restPlanTypes, rankedLots } from "../store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function taxStatus(dateAcquired: string): string {
  const acquired = new Date(dateAcquired);
  const now = new Date();
  const diffMs = now.getTime() - acquired.getTime();
  const oneYear = 365.25 * 24 * 60 * 60 * 1000;
  return diffMs >= oneYear ? "Long Term" : "Short Term";
}

export function LotTable({ groupName }: { groupName: string }) {
  const snap = useSnapshot(store);
  const ticker = snap.tickers[snap.activeSymbol];
  if (!ticker) return null;

  const planTypes =
    groupName === REST_GROUP
      ? restPlanTypes()
      : ticker.groups.find((g) => g.name === groupName)?.planTypes ?? [];

  if (planTypes.length === 0) return null;

  const hasPrice = ticker.currentPrice != null;
  const allGroupLots = ticker.lots.filter((l) => planTypes.includes(l.planType));
  const ranked = rankedLots(groupName);
  const depleted = allGroupLots.filter((l) => l.remainingQty === 0);
  const lots = [...ranked, ...depleted];

  if (lots.length === 0) return null;

  const totalOriginal = lots.reduce((s, l) => s + l.originalQty, 0);
  const totalSold = lots.reduce(
    (s, l) => s + (l.originalQty - l.remainingQty),
    0
  );
  const totalRemaining = lots.reduce((s, l) => s + l.remainingQty, 0);
  const totalCost = lots.reduce(
    (s, l) => s + l.remainingQty * l.costBasisPerShare,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{groupName}</CardTitle>
            <CardDescription>
              {planTypes.join(", ")} — {hasPrice ? "lowest tax cost sold first" : "highest cost basis sold first"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="tabular-nums">
              {totalRemaining.toLocaleString()} remaining
            </Badge>
            {totalSold > 0 && (
              <Badge variant="outline" className="tabular-nums">
                {totalSold.toLocaleString()} sold
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Lot ID</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Acquired</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Sold</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Cost Basis</TableHead>
              <TableHead className="text-right">Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot, i) => {
              const sold = lot.originalQty - lot.remainingQty;
              const pct = (sold / lot.originalQty) * 100;
              const isDepleted = lot.remainingQty === 0;
              const isLT = taxStatus(lot.dateAcquired) === "Long Term";
              return (
                <TableRow
                  key={lot.id}
                  className={isDepleted ? "opacity-40" : ""}
                >
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {lot.id}
                  </TableCell>
                  <TableCell>{lot.planType}</TableCell>
                  <TableCell>{lot.dateAcquired}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {lot.originalQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive/60 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{sold.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {lot.remainingQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${lot.costBasisPerShare.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={isLT ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {isLT ? "Long Term" : "Short Term"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {totalOriginal.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {totalSold.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {totalRemaining.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                ${totalCost.toLocaleString()}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
