import { useState } from "react";

export function HelpModal() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-sm btn-muted" onClick={() => setOpen(true)}>
        CSV Format Help
      </button>
    );
  }

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>CSV Import Format</h2>
          <button className="modal-close" onClick={() => setOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            Columns are matched by header name (case-insensitive, punctuation
            ignored). Only include the columns you need — order does not matter
            and no extra empty columns are required. Tax status is calculated
            automatically from the acquisition date.
          </p>

          <table className="help-table">
            <thead>
              <tr>
                <th>Header</th>
                <th>Required</th>
                <th>Description</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Symbol</td><td>Yes</td><td>Ticker symbol</td><td>HOOD</td></tr>
              <tr><td>Plan Type</td><td>Yes</td><td>Used for grouping lots</td><td>Perf. Shares</td></tr>
              <tr><td>Date Acquired</td><td>Yes</td><td>Format: DD-MON-YYYY</td><td>28-JUL-2021</td></tr>
              <tr><td>Quantity</td><td>Yes</td><td>Number of shares. Rows with 0 are skipped.</td><td>1308</td></tr>
              <tr><td>Cost Basis</td><td>Yes</td><td>Per-share cost basis. Accepts $, commas.</td><td>$38.00</td></tr>
              <tr><td>Grant Number</td><td>Yes</td><td>Used to build the lot ID</td><td>ES001950</td></tr>
              <tr><td>Vest Period</td><td>Yes</td><td>Used to build the lot ID</td><td>1</td></tr>
              <tr><td>Vest Date</td><td>ESPP only</td><td>Used in lot ID for ESPP plans</td><td>19-NOV-2021</td></tr>
            </tbody>
          </table>

          <h3>Minimum CSV example</h3>
          <pre className="csv-example">{`Symbol,Plan Type,Date Acquired,Quantity,Cost Basis,Grant Number,Vest Period
HOOD,Perf. Shares,28-JUL-2021,1308,$38.00,ES001950,1
HOOD,Rest. Stock,01-JUN-2022,741,$9.37,PH304545,1
HOOD,ESPP,19-NOV-2021,272,$24.64,2021,0`}</pre>

          <h3>Notes</h3>
          <ul>
            <li>Also accepts the full Robinhood equity export format (columns matched by header).</li>
            <li>Dates must be in DD-MON-YYYY format (e.g. 01-MAR-2023).</li>
            <li>Dollar values can include $, commas, and spaces.</li>
            <li>Quoted fields with commas inside are handled (standard CSV quoting).</li>
            <li>The first data row determines the ticker symbol.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
