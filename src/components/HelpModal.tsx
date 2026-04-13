import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          CSV Format Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV Import Format</DialogTitle>
          <DialogDescription>
            Columns are matched by header name (case-insensitive, punctuation
            ignored). Only include the columns you need — order does not matter.
            Tax status is calculated automatically from the acquisition date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Header</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Symbol", "Yes", "Ticker symbol", "HOOD"],
                ["Plan Type", "Yes", "Used for grouping lots", "Perf. Shares"],
                ["Date Acquired", "Yes", "Format: DD-MON-YYYY", "28-JUL-2021"],
                ["Quantity", "Yes", "Number of shares (0 = skipped)", "1308"],
                ["Cost Basis", "Yes", "Per-share cost basis", "$38.00"],
                ["Grant Number", "Yes", "Used to build the lot ID", "ES001950"],
                [
                  "Vest ID",
                  "No",
                  "Used to build the lot ID. Falls back to Date Acquired if omitted.",
                  "1",
                ],
              ].map(([header, req, desc, example]) => (
                <TableRow key={header}>
                  <TableCell className="font-mono text-xs font-medium">
                    {header}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={req === "Yes" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {req}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {desc}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div>
            <h3 className="text-sm font-semibold mb-2">Minimum CSV example</h3>
            <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono leading-relaxed overflow-x-auto">
{`Symbol,Plan Type,Date Acquired,Quantity,Cost Basis,Grant Number
HOOD,Perf. Shares,28-JUL-2021,1308,$38.00,ES001950
HOOD,Rest. Stock,01-JUN-2022,741,$9.37,PH304545
HOOD,ESPP,19-NOV-2021,272,$24.64,2021`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
              <li>
                Also accepts the full Robinhood equity export format (columns
                matched by header).
              </li>
              <li>Dates must be in DD-MON-YYYY format (e.g. 01-MAR-2023).</li>
              <li>Dollar values can include $, commas, and spaces.</li>
              <li>
                Quoted fields with commas inside are handled (standard CSV
                quoting).
              </li>
              <li>The first data row determines the ticker symbol.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
