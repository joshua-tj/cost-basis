import { useState } from "react";
import { useSnapshot } from "valtio";
import { store, updateSale, deleteSales, REST_GROUP } from "../store";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

function EditableCell({
  value,
  onSave,
  type = "text",
  prefix,
}: {
  value: string;
  onSave: (val: string) => void;
  type?: "text" | "number" | "date";
  prefix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span
        className="cursor-pointer rounded px-1 py-0.5 border-b border-dashed border-border hover:bg-muted transition-colors"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {prefix}
        {type === "number" ? parseFloat(value).toFixed(2) : value}
      </span>
    );
  }

  return (
    <input
      className="w-24 rounded border border-primary bg-background px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      type={type}
      value={draft}
      step={type === "number" ? "0.01" : undefined}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (draft !== value) onSave(draft);
        }
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

function EditableSelect({
  value,
  options,
  onSave,
}: {
  value: string;
  options: string[];
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <span
        className="cursor-pointer rounded px-1 py-0.5 border-b border-dashed border-border hover:bg-muted transition-colors"
        onClick={() => setEditing(true)}
      >
        {value}
      </span>
    );
  }

  return (
    <select
      className="rounded border border-primary bg-background px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      value={value}
      autoFocus
      onChange={(e) => {
        onSave(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function SaleHistory() {
  const snap = useSnapshot(store);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ticker = snap.tickers[snap.activeSymbol];
  if (!ticker || ticker.sales.length === 0) return null;

  const groupNames = [REST_GROUP, ...ticker.groups.map((g) => g.name)];
  const allIds = ticker.sales.map((s) => s.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const hasSelection = selected.size > 0;

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(allIds));
  const clearSelection = () => setSelected(new Set());

  const displaySales = hasSelection
    ? ticker.sales.filter((s) => selected.has(s.id))
    : ticker.sales;

  const totalQty = displaySales.reduce((s, sale) => s + sale.qty, 0);
  const totalProceeds = displaySales.reduce(
    (s, sale) => s + sale.salePrice * sale.qty,
    0
  );
  const totalCostBasis = displaySales.reduce(
    (s, sale) => s + sale.costBasisPerShare * sale.qty,
    0
  );
  const totalGain = displaySales.reduce((s, sale) => s + sale.gainLoss, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sale History</CardTitle>
            <CardDescription>
              Click values to edit (except quantity). Gain/loss recalculates
              automatically.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            {hasSelection && (
              <>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete ${selected.size} sale${selected.size > 1 ? "s" : ""}? Shares will be restored to their lots.`
                      )
                    ) {
                      deleteSales(selected);
                      setSelected(new Set());
                    }
                  }}
                >
                  Delete ({selected.size})
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() =>
                    allSelected ? clearSelection() : selectAll()
                  }
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Sale Price</TableHead>
              <TableHead className="text-right">Proceeds</TableHead>
              <TableHead className="text-right">Cost Basis</TableHead>
              <TableHead className="text-right">Total Cost Basis</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead className="text-right">Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticker.sales.map((sale) => (
              <TableRow
                key={sale.id}
                className={selected.has(sale.id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(sale.id)}
                    onCheckedChange={() => toggleOne(sale.id)}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={sale.date}
                    type="date"
                    onSave={(v) => updateSale(sale.id, { date: v })}
                  />
                </TableCell>
                <TableCell>
                  <EditableSelect
                    value={sale.group}
                    options={groupNames}
                    onSave={(v) => updateSale(sale.id, { group: v })}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {sale.lotId}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {sale.qty.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <EditableCell
                    value={sale.salePrice.toString()}
                    type="number"
                    prefix="$"
                    onSave={(v) =>
                      updateSale(sale.id, { salePrice: parseFloat(v) })
                    }
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${fmt(sale.salePrice * sale.qty)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <EditableCell
                    value={sale.costBasisPerShare.toString()}
                    type="number"
                    prefix="$"
                    onSave={(v) =>
                      updateSale(sale.id, {
                        costBasisPerShare: parseFloat(v),
                      })
                    }
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${fmt(sale.costBasisPerShare * sale.qty)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums font-medium ${
                    sale.gainLoss >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                >
                  ${fmt(sale.gainLoss)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      sale.taxStatus === "Long Term" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    <EditableSelect
                      value={sale.taxStatus}
                      options={["Long Term", "Short Term"]}
                      onSave={(v) => updateSale(sale.id, { taxStatus: v })}
                    />
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">
                {hasSelection ? `Selected (${selected.size})` : "Total Realized"}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {totalQty.toLocaleString()}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums font-semibold">
                ${fmt(totalProceeds)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums font-semibold">
                ${fmt(totalCostBasis)}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums font-semibold ${
                  totalGain >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                ${fmt(totalGain)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
