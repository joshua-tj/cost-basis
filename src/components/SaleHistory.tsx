import { useState } from "react";
import { useSnapshot } from "valtio";
import { store, updateSale, deleteSales, REST_GROUP } from "../store";

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
      <span className="editable" onClick={() => { setDraft(value); setEditing(true); }}>
        {prefix}{type === "number" ? parseFloat(value).toFixed(2) : value}
      </span>
    );
  }

  return (
    <input
      className="inline-edit"
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
      <span className="editable" onClick={() => setEditing(true)}>
        {value}
      </span>
    );
  }

  return (
    <select
      className="inline-edit"
      value={value}
      autoFocus
      onChange={(e) => {
        onSave(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export function SaleHistory() {
  const snap = useSnapshot(store);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ticker = snap.tickers[snap.activeSymbol];
  if (!ticker || ticker.sales.length === 0) return null;

  const groupNames = [REST_GROUP, ...ticker.groups.map((g) => g.name)];
  const allIds = ticker.sales.map((s) => s.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
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
  const totalProceeds = displaySales.reduce((s, sale) => s + sale.salePrice * sale.qty, 0);
  const totalCostBasis = displaySales.reduce((s, sale) => s + sale.costBasisPerShare * sale.qty, 0);
  const totalGain = displaySales.reduce((s, sale) => s + sale.gainLoss, 0);
  const label = hasSelection ? `Selected (${selected.size})` : "Total Realized";

  return (
    <div className="sale-history">
      <div className="sale-history-header">
        <div>
          <h2>Sale History</h2>
          <p className="subtitle">Click any value to edit (except quantity). Gain/loss recalculates automatically.</p>
        </div>
        <div className="selection-actions">
          <button className="btn btn-sm btn-muted" onClick={selectAll}>Select All</button>
          {hasSelection && (
            <>
              <button className="btn btn-sm btn-muted" onClick={clearSelection}>Clear</button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (confirm(`Delete ${selected.size} sale${selected.size > 1 ? "s" : ""}? Shares will be restored to their lots.`)) {
                    deleteSales(selected);
                    setSelected(new Set());
                  }
                }}
              >
                Delete ({selected.size})
              </button>
            </>
          )}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th className="check-col">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={allSelected ? clearSelection : selectAll}
              />
            </th>
            <th>Date</th>
            <th>Group</th>
            <th>Lot</th>
            <th className="num">Qty</th>
            <th className="num">Sale Price</th>
            <th className="num">Proceeds</th>
            <th className="num">Cost Basis</th>
            <th className="num">Total Cost Basis</th>
            <th className="num">Gain/Loss</th>
            <th>Tax</th>
          </tr>
        </thead>
        <tbody>
          {ticker.sales.map((sale) => (
            <tr key={sale.id} className={selected.has(sale.id) ? "selected-row" : ""}>
              <td className="check-col">
                <input
                  type="checkbox"
                  checked={selected.has(sale.id)}
                  onChange={() => toggleOne(sale.id)}
                />
              </td>
              <td>
                <EditableCell
                  value={sale.date}
                  type="date"
                  onSave={(v) => updateSale(sale.id, { date: v })}
                />
              </td>
              <td>
                <EditableSelect
                  value={sale.group}
                  options={groupNames}
                  onSave={(v) => updateSale(sale.id, { group: v })}
                />
              </td>
              <td className="mono">{sale.lotId}</td>
              <td className="num">{sale.qty.toLocaleString()}</td>
              <td className="num">
                <EditableCell
                  value={sale.salePrice.toString()}
                  type="number"
                  prefix="$"
                  onSave={(v) => updateSale(sale.id, { salePrice: parseFloat(v) })}
                />
              </td>
              <td className="num">
                ${(sale.salePrice * sale.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="num">
                <EditableCell
                  value={sale.costBasisPerShare.toString()}
                  type="number"
                  prefix="$"
                  onSave={(v) => updateSale(sale.id, { costBasisPerShare: parseFloat(v) })}
                />
              </td>
              <td className="num">
                ${(sale.costBasisPerShare * sale.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className={`num ${sale.gainLoss >= 0 ? "gain" : "loss"}`}>
                ${sale.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td>
                <EditableSelect
                  value={sale.taxStatus}
                  options={["Long Term", "Short Term"]}
                  onSave={(v) => updateSale(sale.id, { taxStatus: v })}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>{label}</td>
            <td className="num">{totalQty.toLocaleString()}</td>
            <td></td>
            <td className="num">
              ${totalProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td></td>
            <td className="num">
              ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className={`num ${totalGain >= 0 ? "gain" : "loss"}`}>
              ${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
