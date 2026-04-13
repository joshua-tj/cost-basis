import { useSnapshot } from "valtio";
import { store, importCSV, switchTicker, REST_GROUP } from "./store";
import { LotTable } from "./components/LotTable";
import { SaleForm } from "./components/SaleForm";
import { SaleHistory } from "./components/SaleHistory";
import { GroupManager } from "./components/GroupManager";
import { HelpModal } from "./components/HelpModal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cost Basis Tracker
            </h1>
            {ticker && (
              <p className="mt-1 text-sm text-muted-foreground">
                Tracking {snap.activeSymbol} lots and sales
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {snap.symbols.length > 0 && (
              <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                {snap.symbols.map((sym) => (
                  <button
                    key={sym}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      sym === snap.activeSymbol
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => switchTicker(sym)}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
            <HelpModal />
            <Button className="cursor-pointer" onClick={() => document.getElementById('csv-input')?.click()}>
              Import CSV
            </Button>
            <input id="csv-input" type="file" accept=".csv" onChange={handleImport} hidden />
          </div>
        </div>

        {ticker ? (
          <div className="space-y-8">
            <GroupManager />

            <div className="space-y-6">
              <LotTable groupName={REST_GROUP} />
              {ticker.groups.map((g) => (
                <LotTable key={g.name} groupName={g.name} />
              ))}
            </div>

            <Separator />

            <SaleForm />
            <SaleHistory />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">No data yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Import a CSV to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
