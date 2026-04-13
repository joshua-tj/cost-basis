import { useState } from "react";
import { useSnapshot } from "valtio";
import {
  store,
  rankedLots,
  executeSale,
  REST_GROUP,
  restPlanTypes,
} from "../store";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SaleForm() {
  const snap = useSnapshot(store);
  const ticker = snap.tickers[snap.activeSymbol];
  const customGroups = ticker?.groups ?? [];
  const allGroupNames = [REST_GROUP, ...customGroups.map((g) => g.name)];

  const [group, setGroup] = useState(REST_GROUP);
  const [qty, setQty] = useState("");
  const [priceMode, setPriceMode] = useState<"price" | "proceeds">("price");
  const [priceInput, setPriceInput] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<
    { lotId: string; qty: number; costBasis: number; gainLoss: number }[] | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const groupPlanTypes =
    group === REST_GROUP
      ? restPlanTypes()
      : customGroups.find((g) => g.name === group)?.planTypes ?? [];
  const available = ticker
    ? ticker.lots
        .filter(
          (l) =>
            l.remainingQty > 0 && groupPlanTypes.includes(l.planType)
        )
        .reduce((s, l) => s + l.remainingQty, 0)
    : 0;

  const getSalePrice = (): number | null => {
    const q = parseInt(qty);
    const val = parseFloat(priceInput);
    if (!q || q <= 0 || !val || val <= 0) return null;
    return priceMode === "proceeds" ? val / q : val;
  };

  const handlePreview = () => {
    setError("");
    setSuccess("");
    const q = parseInt(qty);
    const salePrice = getSalePrice();
    if (!q || q <= 0) return setError("Enter a valid quantity");
    if (salePrice === null)
      return setError(
        `Enter a valid ${priceMode === "proceeds" ? "proceeds" : "price"}`
      );
    if (q > available) return setError(`Only ${available} shares available`);

    const ranked = rankedLots(group);
    let remaining = q;
    const allocs: typeof preview = [];
    for (const lot of ranked) {
      if (remaining <= 0) break;
      const sell = Math.min(remaining, lot.remainingQty);
      allocs.push({
        lotId: lot.id,
        qty: sell,
        costBasis: lot.costBasisPerShare,
        gainLoss: (salePrice - lot.costBasisPerShare) * sell,
      });
      remaining -= sell;
    }
    setPreview(allocs);
  };

  const handleConfirm = () => {
    const salePrice = getSalePrice();
    if (salePrice === null) return;
    try {
      executeSale(parseInt(qty), salePrice, date, group);
      setSuccess(`Sold ${qty} shares @ $${salePrice.toFixed(2)}`);
      setPreview(null);
      setQty("");
      setPriceInput("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (allGroupNames.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Record Sale</CardTitle>
        <CardDescription>
          Select a group and enter sale details. Lots are sold highest cost basis
          first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Group */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Group</label>
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              {allGroupNames.map((name) => (
                <button
                  key={name}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    group === name
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setGroup(name);
                    setPreview(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Qty */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Shares</label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setPreview(null);
              }}
              min={1}
              max={available}
              className="w-28"
            />
          </div>

          {/* Price / Proceeds */}
          <div className="space-y-1.5">
            <div className="flex items-center rounded-md border bg-muted/50 p-0.5 w-fit">
              <button
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  priceMode === "price"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setPriceMode("price");
                  setPreview(null);
                }}
              >
                Sale Price
              </button>
              <button
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  priceMode === "proceeds"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setPriceMode("proceeds");
                  setPreview(null);
                }}
              >
                Proceeds
              </button>
            </div>
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                setPreview(null);
              }}
              step="0.01"
              min={0}
              placeholder={
                priceMode === "proceeds" ? "Total proceeds" : "Per share"
              }
              className="w-36"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
          </div>

          <Button onClick={handlePreview}>Preview</Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {available.toLocaleString()} shares available
        </p>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {success}
          </p>
        )}

        {preview && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h3 className="text-sm font-semibold">Sale Preview</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((a) => (
                  <TableRow key={a.lotId}>
                    <TableCell className="font-mono text-xs">
                      {a.lotId}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.qty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${a.costBasis.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-medium ${
                        a.gainLoss >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      $
                      {a.gainLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {preview
                      .reduce((s, a) => s + a.qty, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell />
                  <TableCell
                    className={`text-right tabular-nums font-semibold ${
                      preview.reduce((s, a) => s + a.gainLoss, 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    $
                    {preview
                      .reduce((s, a) => s + a.gainLoss, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirm Sale
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
