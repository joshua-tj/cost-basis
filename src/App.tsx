import { useSnapshot } from "valtio";
import { store, importCSV, switchTicker, REST_GROUP } from "./store";
import { LotTable } from "./components/LotTable";
import { SaleForm } from "./components/SaleForm";
import { SaleHistory } from "./components/SaleHistory";
import { GroupManager } from "./components/GroupManager";
import { HelpModal } from "./components/HelpModal";
import "./App.css";

function App() {
  const snap = useSnapshot(store);
  const ticker = snap.tickers[snap.activeSymbol];

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importCSV(reader.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Cost Basis Tracker</h1>
        <div className="header-actions">
          {snap.symbols.length > 0 && (
            <div className="ticker-tabs">
              {snap.symbols.map((sym) => (
                <button
                  key={sym}
                  className={`ticker-tab ${sym === snap.activeSymbol ? "active" : ""}`}
                  onClick={() => switchTicker(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
          <HelpModal />
          <label className="btn import-btn">
            Import CSV
            <input type="file" accept=".csv" onChange={handleImport} hidden />
          </label>
        </div>
      </div>

      {ticker && (
        <>
          <GroupManager />

          <div className="tables">
            <LotTable groupName={REST_GROUP} />
            {ticker.groups.map((g) => (
              <LotTable key={g.name} groupName={g.name} />
            ))}
          </div>

          <SaleForm />
          <SaleHistory />
        </>
      )}

      {!ticker && (
        <p className="empty">Import a CSV to get started.</p>
      )}
    </div>
  );
}

export default App;
