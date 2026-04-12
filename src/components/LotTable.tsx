import { useSnapshot } from "valtio";
import { store, REST_GROUP, restPlanTypes } from "../store";

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

  const lots = ticker.lots
    .filter((l) => planTypes.includes(l.planType))
    .slice()
    .sort((a, b) => {
      if (b.costBasisPerShare !== a.costBasisPerShare)
        return b.costBasisPerShare - a.costBasisPerShare;
      return a.dateAcquired.localeCompare(b.dateAcquired);
    });

  if (lots.length === 0) return null;

  const totalOriginal = lots.reduce((s, l) => s + l.originalQty, 0);
  const totalSold = lots.reduce((s, l) => s + (l.originalQty - l.remainingQty), 0);
  const totalRemaining = lots.reduce((s, l) => s + l.remainingQty, 0);
  const totalCost = lots.reduce(
    (s, l) => s + l.remainingQty * l.costBasisPerShare,
    0
  );

  return (
    <div className="lot-table">
      <h2>{groupName}</h2>
      <p className="subtitle">
        {planTypes.join(", ")} — sell priority: highest cost basis first
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Lot ID</th>
            <th>Plan</th>
            <th>Acquired</th>
            <th className="num">Total</th>
            <th className="num">Sold</th>
            <th className="num">Remaining</th>
            <th className="num">Cost Basis</th>
            <th>Tax</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot, i) => (
            <tr key={lot.id} className={lot.remainingQty === 0 ? "depleted" : ""}>
              <td>{i + 1}</td>
              <td className="mono">{lot.id}</td>
              <td>{lot.planType}</td>
              <td>{lot.dateAcquired}</td>
              <td className="num">{lot.originalQty.toLocaleString()}</td>
              <td className="num sold-cell">
                <div className="sold-bar-wrap">
                  <div
                    className="sold-bar"
                    style={{ width: `${((lot.originalQty - lot.remainingQty) / lot.originalQty) * 100}%` }}
                  />
                </div>
                {(lot.originalQty - lot.remainingQty).toLocaleString()}
              </td>
              <td className="num">{lot.remainingQty.toLocaleString()}</td>
              <td className="num">${lot.costBasisPerShare.toFixed(2)}</td>
              <td>{taxStatus(lot.dateAcquired)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>Total</td>
            <td className="num">{totalOriginal.toLocaleString()}</td>
            <td className="num">{totalSold.toLocaleString()}</td>
            <td className="num">{totalRemaining.toLocaleString()}</td>
            <td className="num">${totalCost.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
