import { useState } from "react";
import { useSnapshot } from "valtio";
import { store, rankedLots, executeSale, REST_GROUP, restPlanTypes } from "../store";

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
        .filter((l) => l.remainingQty > 0 && groupPlanTypes.includes(l.planType))
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
    if (salePrice === null) return setError(`Enter a valid ${priceMode === "proceeds" ? "proceeds" : "price"}`);
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
    <div className="sale-form">
      <h2>Record Sale</h2>

      <div className="form-row">
        <div className="field">
          <label>Group</label>
          <div className="toggle-group">
            {allGroupNames.map((name) => (
              <button
                key={name}
                className={group === name ? "active" : ""}
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

        <div className="field">
          <label>Shares</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setPreview(null);
            }}
            min={1}
            max={available}
          />
        </div>

        <div className="field">
          <label>
            <div className="toggle-group toggle-group-sm">
              <button
                className={priceMode === "price" ? "active" : ""}
                onClick={() => { setPriceMode("price"); setPreview(null); }}
              >
                Sale Price ($)
              </button>
              <button
                className={priceMode === "proceeds" ? "active" : ""}
                onClick={() => { setPriceMode("proceeds"); setPreview(null); }}
              >
                Proceeds ($)
              </button>
            </div>
          </label>
          <input
            type="number"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value);
              setPreview(null);
            }}
            step="0.01"
            min={0}
            placeholder={priceMode === "proceeds" ? "Total proceeds" : "Per share"}
          />
        </div>

        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <button className="btn" onClick={handlePreview}>
            Preview
          </button>
        </div>
      </div>
      <span className="avail">{available.toLocaleString()} shares available</span>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {preview && (
        <div className="preview">
          <h3>Sale Preview</h3>
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th className="num">Qty</th>
                <th className="num">Cost Basis</th>
                <th className="num">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((a) => (
                <tr key={a.lotId}>
                  <td className="mono">{a.lotId}</td>
                  <td className="num">{a.qty.toLocaleString()}</td>
                  <td className="num">${a.costBasis.toFixed(2)}</td>
                  <td className={`num ${a.gainLoss >= 0 ? "gain" : "loss"}`}>
                    ${a.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">
                  {preview.reduce((s, a) => s + a.qty, 0).toLocaleString()}
                </td>
                <td></td>
                <td
                  className={`num ${preview.reduce((s, a) => s + a.gainLoss, 0) >= 0 ? "gain" : "loss"}`}
                >
                  $
                  {preview
                    .reduce((s, a) => s + a.gainLoss, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
          <button className="btn confirm-btn" onClick={handleConfirm}>
            Confirm Sale
          </button>
        </div>
      )}
    </div>
  );
}
