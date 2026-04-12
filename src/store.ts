import { proxy, subscribe } from "valtio";

export interface Lot {
  id: string;
  symbol: string;
  planType: string;
  dateAcquired: string;
  originalQty: number;
  remainingQty: number;
  costBasisPerShare: number;
  grantNumber: string;
  vestPeriod: string;
}

export interface Sale {
  id: string;
  date: string;
  lotId: string;
  qty: number;
  salePrice: number;
  costBasisPerShare: number;
  gainLoss: number;
  taxStatus: string;
  group: string;
}

export interface Group {
  name: string;
  planTypes: string[];
}

export interface TickerState {
  symbol: string;
  lots: Lot[];
  sales: Sale[];
  groups: Group[];
}

export interface AppState {
  activeSymbol: string;
  symbols: string[];
  tickers: Record<string, TickerState>;
}

const STORAGE_KEY = "costbasis";

function loadAll(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AppState;
      // Migrate tickers that don't have groups yet
      for (const sym of parsed.symbols) {
        const t = parsed.tickers[sym];
        if (t && !t.groups) {
          t.groups = buildDefaultGroups(t.lots);
        }
      }
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function buildDefaultGroups(_lots: Lot[]): Group[] {
  // Start with no custom groups — "Rest" is implicit and catches everything
  return [];
}

// "Rest" contains all plan types not claimed by any explicit group
export function restPlanTypes(): string[] {
  const ticker = activeTicker();
  if (!ticker) return [];
  const allPlan = [...new Set(ticker.lots.map((l) => l.planType))];
  const claimed = new Set(ticker.groups.flatMap((g) => g.planTypes));
  return allPlan.filter((pt) => !claimed.has(pt));
}

export const REST_GROUP = "Rest";

function saveAll(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const saved = loadAll();

export const store = proxy<AppState>(
  saved ?? {
    activeSymbol: "",
    symbols: [],
    tickers: {},
  }
);

subscribe(store, () => {
  saveAll(store);
});

// --- Active ticker helpers ---

export function activeTicker(): TickerState | null {
  return store.tickers[store.activeSymbol] ?? null;
}

export function switchTicker(symbol: string) {
  if (store.symbols.includes(symbol)) {
    store.activeSymbol = symbol;
  }
}

// --- Group management ---

export function addGroup(name: string, planTypes: string[]) {
  const ticker = activeTicker();
  if (!ticker) return;
  ticker.groups.push({ name, planTypes });
}

export function removeGroup(index: number) {
  const ticker = activeTicker();
  if (!ticker) return;
  ticker.groups.splice(index, 1);
}

export function updateGroup(index: number, name: string, planTypes: string[]) {
  const ticker = activeTicker();
  if (!ticker) return;
  ticker.groups[index] = { name, planTypes };
}

export function allPlanTypes(): string[] {
  const ticker = activeTicker();
  if (!ticker) return [];
  return [...new Set(ticker.lots.map((l) => l.planType))];
}

// --- CSV parsing ---

function parseDollar(s: string): number {
  s = s.trim().replace(/[$,]/g, "");
  if (!s || s === "--" || s === "NA") return 0;
  return parseFloat(s);
}

function parseDate(s: string): string {
  s = s.trim();
  if (!s || s === "NA") return "";
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const [day, mon, year] = s.split("-");
  return `${year}-${months[mon]}-${day}`;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function col(headers: string[], row: string[], ...names: string[]): string {
  for (const name of names) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().replace(/[^a-z]/g, "") === name.toLowerCase().replace(/[^a-z]/g, "")
    );
    if (idx !== -1 && idx < row.length) return row[idx].trim();
  }
  return "";
}

export function importCSV(csvText: string) {
  const lines = csvText.trim().split("\n");
  const headers = parseCSVRow(lines[0]).map((h) => h.trim());
  const lots: Lot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    const symbol = col(headers, row, "Symbol");
    if (!symbol || symbol === "Overall Total") continue;

    const planType = col(headers, row, "PlanType");
    const isEspp = planType === "ESPP";
    const sellable = parseInt(col(headers, row, "Quantity", "Qty", "SellableQty")) || 0;
    if (sellable <= 0) continue;

    const costBasis = parseDollar(col(headers, row, "EstCostBasispershare", "CostBasis", "CostBasisPerShare"));
    const grantNumber = col(headers, row, "GrantNumber");
    const vestPeriod = col(headers, row, "VestPeriod");
    const dateAcquired = parseDate(col(headers, row, "DateAcquired"));
    const vestDate = col(headers, row, "VestDate");

    const id = isEspp
      ? `ESPP-${grantNumber}-${parseDate(vestDate)}`
      : `${grantNumber}-v${vestPeriod}`;

    lots.push({
      id,
      symbol,
      planType,
      dateAcquired,
      originalQty: sellable,
      remainingQty: sellable,
      costBasisPerShare: costBasis,
      grantNumber,
      vestPeriod,
    });
  }

  if (lots.length === 0) return;

  const symbol = lots[0].symbol;
  const groups = buildDefaultGroups(lots);
  store.tickers[symbol] = { symbol, lots, sales: [], groups };
  if (!store.symbols.includes(symbol)) {
    store.symbols.push(symbol);
  }
  store.activeSymbol = symbol;
}

function getTaxStatus(dateAcquired: string, saleDate: string): string {
  const acquired = new Date(dateAcquired);
  const sold = new Date(saleDate);
  const diffMs = sold.getTime() - acquired.getTime();
  const oneYear = 365.25 * 24 * 60 * 60 * 1000;
  return diffMs >= oneYear ? "Long Term" : "Short Term";
}

// --- Lot ranking ---

function planTypesForGroup(groupName: string): string[] {
  if (groupName === REST_GROUP) return restPlanTypes();
  const ticker = activeTicker();
  if (!ticker) return [];
  const group = ticker.groups.find((g) => g.name === groupName);
  return group ? group.planTypes : [];
}

export function rankedLots(groupName: string): Lot[] {
  const ticker = activeTicker();
  if (!ticker) return [];
  const pts = planTypesForGroup(groupName);
  return ticker.lots
    .filter((l) => l.remainingQty > 0 && pts.includes(l.planType))
    .sort((a, b) => {
      if (b.costBasisPerShare !== a.costBasisPerShare)
        return b.costBasisPerShare - a.costBasisPerShare;
      return a.dateAcquired.localeCompare(b.dateAcquired);
    });
}

// --- Sale execution ---

export function executeSale(
  qty: number,
  salePrice: number,
  saleDate: string,
  groupName: string
): Sale[] {
  const ticker = activeTicker();
  if (!ticker) throw new Error("No active ticker");

  const ranked = rankedLots(groupName);
  let remaining = qty;
  const newSales: Sale[] = [];

  for (const lot of ranked) {
    if (remaining <= 0) break;
    const sellFromLot = Math.min(remaining, lot.remainingQty);
    if (sellFromLot <= 0) continue;

    const sale: Sale = {
      id: `${Date.now()}-${lot.id}-${Math.random().toString(36).slice(2, 6)}`,
      date: saleDate,
      lotId: lot.id,
      qty: sellFromLot,
      salePrice,
      costBasisPerShare: lot.costBasisPerShare,
      gainLoss: (salePrice - lot.costBasisPerShare) * sellFromLot,
      taxStatus: getTaxStatus(lot.dateAcquired, saleDate),
      group: groupName,
    };
    newSales.push(sale);
    remaining -= sellFromLot;
  }

  if (remaining > 0) {
    throw new Error(
      `Not enough shares. Only ${qty - remaining} available in "${groupName}" lots.`
    );
  }

  for (const sale of newSales) {
    const lot = ticker.lots.find((l) => l.id === sale.lotId)!;
    lot.remainingQty -= sale.qty;
    ticker.sales.push(sale);
  }

  return newSales;
}

// --- Sale editing ---

export function updateSale(
  saleId: string,
  updates: Partial<Pick<Sale, "date" | "salePrice" | "costBasisPerShare" | "taxStatus" | "group">>
) {
  const ticker = activeTicker();
  if (!ticker) return;
  const sale = ticker.sales.find((s) => s.id === saleId);
  if (!sale) return;

  if (updates.date !== undefined) sale.date = updates.date;
  if (updates.salePrice !== undefined) sale.salePrice = updates.salePrice;
  if (updates.costBasisPerShare !== undefined) sale.costBasisPerShare = updates.costBasisPerShare;
  if (updates.taxStatus !== undefined) sale.taxStatus = updates.taxStatus;
  if (updates.group !== undefined) sale.group = updates.group;

  sale.gainLoss = (sale.salePrice - sale.costBasisPerShare) * sale.qty;
}

export function deleteSales(saleIds: Set<string>) {
  const ticker = activeTicker();
  if (!ticker) return;

  for (const id of saleIds) {
    const sale = ticker.sales.find((s) => s.id === id);
    if (!sale) continue;
    // Restore shares to the lot
    const lot = ticker.lots.find((l) => l.id === sale.lotId);
    if (lot) lot.remainingQty += sale.qty;
  }

  ticker.sales = ticker.sales.filter((s) => !saleIds.has(s.id));
}
