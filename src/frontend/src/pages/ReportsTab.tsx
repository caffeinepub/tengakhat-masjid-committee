import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAllPayments, useMembers } from "../hooks/useQueries";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
// From 2020 up to 20 years in the future — auto-expands every year
const YEARS = Array.from(
  { length: CURRENT_YEAR - 2020 + 21 },
  (_, i) => 2020 + i,
);

type ReportType = "members" | "payments" | "summary";

function statusBadgeClass(status: string) {
  if (status === "Paid") return "bg-green-100 text-green-800 border-green-300";
  if (status === "Partial")
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

// Helper: download a string as a file
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper: escape CSV cell
function csvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

export default function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportType>("members");
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(CURRENT_YEAR);

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();

  const isLoading = membersLoading || paymentsLoading;

  // Build member lookup
  const memberMap = new Map(
    (members ?? []).map((m) => [String(m.memberId), m]),
  );

  // Monthly summary data
  const summaryData = (members ?? []).map((m) => {
    const payment = (payments ?? []).find(
      (p) =>
        String(p.memberId) === String(m.memberId) &&
        Number(p.month) === summaryMonth &&
        Number(p.year) === summaryYear,
    );
    return {
      memberId: String(m.memberId),
      name: m.name,
      phone: m.phone,
      monthlyFee: Number(m.monthlyFee),
      amountPaid: payment ? Number(payment.amountPaid) : 0,
      status: payment ? payment.status : "Unpaid",
      paymentMode: payment ? payment.paymentMode : "\u2014",
    };
  });

  // ── PDF Export (print-to-PDF via browser) ─────────────────────────────────
  function exportPDF() {
    try {
      let tableHtml = "";
      let tableTitle = "";

      if (activeReport === "members") {
        tableTitle = "Member List";
        tableHtml = `
          <table>
            <thead><tr><th>Member ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Monthly Fee (&#8377;)</th></tr></thead>
            <tbody>
              ${(members ?? []).map((m) => `<tr><td>#${m.memberId}</td><td>${m.name}</td><td>${m.phone}</td><td>${m.address || "\u2014"}</td><td>&#8377;${Number(m.monthlyFee).toLocaleString()}</td></tr>`).join("")}
            </tbody>
          </table>`;
      } else if (activeReport === "payments") {
        tableTitle = "Payment History";
        tableHtml = `
          <table>
            <thead><tr><th>Payment ID</th><th>Member</th><th>Month/Year</th><th>Amount (&#8377;)</th><th>Status</th><th>Mode</th></tr></thead>
            <tbody>
              ${(payments ?? []).map((p) => `<tr><td>#${p.paymentId}</td><td>${memberMap.get(String(p.memberId))?.name ?? `#${p.memberId}`}</td><td>${MONTHS[Number(p.month) - 1]} ${Number(p.year)}</td><td>&#8377;${Number(p.amountPaid).toLocaleString()}</td><td>${p.status}</td><td>${p.paymentMode}</td></tr>`).join("")}
            </tbody>
          </table>`;
      } else {
        const totalCollected = summaryData.reduce(
          (s, r) => s + r.amountPaid,
          0,
        );
        const totalFees = summaryData.reduce((s, r) => s + r.monthlyFee, 0);
        tableTitle = `Monthly Summary \u2014 ${MONTHS[summaryMonth - 1]} ${summaryYear}`;
        tableHtml = `
          <p class="summary-stats">Total Collected: &#8377;${totalCollected.toLocaleString()} &nbsp;|&nbsp; Total Fees: &#8377;${totalFees.toLocaleString()} &nbsp;|&nbsp; Pending: &#8377;${(totalFees - totalCollected).toLocaleString()}</p>
          <table>
            <thead><tr><th>Member ID</th><th>Name</th><th>Monthly Fee (&#8377;)</th><th>Paid (&#8377;)</th><th>Status</th><th>Mode</th></tr></thead>
            <tbody>
              ${summaryData.map((r) => `<tr><td>#${r.memberId}</td><td>${r.name}</td><td>${r.monthlyFee.toLocaleString()}</td><td>${r.amountPaid.toLocaleString()}</td><td>${r.status}</td><td>${r.paymentMode}</td></tr>`).join("")}
            </tbody>
          </table>`;
      }

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${tableTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { color: #006633; font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; color: #444; margin-bottom: 12px; }
          .summary-stats { font-size: 12px; color: #555; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #006633; color: white; padding: 6px 10px; text-align: left; }
          td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) td { background: #f0fff4; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h1>Tengakhat Masjid Committee</h1>
        <h2>${tableTitle}</h2>
        <p style="font-size:11px;color:#888;">Generated: ${new Date().toLocaleDateString("en-IN")}</p>
        ${tableHtml}
      </body></html>`;

      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Popup blocked. Please allow popups to export PDF.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
      toast.success("Print dialog opened — save as PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  }

  // ── CSV/Excel Export ──────────────────────────────────────────────────────
  function exportExcel() {
    try {
      let csvContent = "";
      let filename = "";

      if (activeReport === "members") {
        const rows = [
          ["Member ID", "Name", "Phone", "Address", "Monthly Fee (INR)"],
          ...(members ?? []).map((m) => [
            String(m.memberId),
            m.name,
            m.phone,
            m.address || "",
            Number(m.monthlyFee),
          ]),
        ];
        csvContent = rows.map(rowToCsv).join("\n");
        filename = "member-list.csv";
      } else if (activeReport === "payments") {
        const rows = [
          [
            "Payment ID",
            "Member",
            "Month",
            "Year",
            "Amount (INR)",
            "Status",
            "Mode",
          ],
          ...(payments ?? []).map((p) => [
            String(p.paymentId),
            memberMap.get(String(p.memberId))?.name ?? String(p.memberId),
            MONTHS[Number(p.month) - 1],
            Number(p.year),
            Number(p.amountPaid),
            p.status,
            p.paymentMode,
          ]),
        ];
        csvContent = rows.map(rowToCsv).join("\n");
        filename = "payment-history.csv";
      } else {
        const rows = [
          [`Monthly Summary: ${MONTHS[summaryMonth - 1]} ${summaryYear}`],
          [],
          [
            "Member ID",
            "Name",
            "Monthly Fee (INR)",
            "Paid (INR)",
            "Status",
            "Mode",
          ],
          ...summaryData.map((r) => [
            r.memberId,
            r.name,
            r.monthlyFee,
            r.amountPaid,
            r.status,
            r.paymentMode,
          ]),
          [],
          [
            "Total",
            "",
            summaryData.reduce((s, r) => s + r.monthlyFee, 0),
            summaryData.reduce((s, r) => s + r.amountPaid, 0),
            "",
            "",
          ],
        ];
        csvContent = rows.map(rowToCsv).join("\n");
        filename = `summary-${MONTHS[summaryMonth - 1]}-${summaryYear}.csv`;
      }

      // Add BOM for Excel UTF-8 compatibility
      downloadFile(`FEFF${csvContent}`, filename, "text/csv;charset=utf-8;");
      toast.success("CSV file downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate file. Please try again.");
    }
  }

  const reportTabs: { id: ReportType; label: string }[] = [
    { id: "members", label: "Member List" },
    { id: "payments", label: "Payment History" },
    { id: "summary", label: "Monthly Summary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports & Export</h2>
        <p className="text-muted-foreground text-sm">
          Download reports as PDF or CSV
        </p>
      </div>

      {/* Report type tabs */}
      <div className="flex gap-2 flex-wrap">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveReport(tab.id)}
            data-ocid={`reports.${tab.id}.tab`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeReport === tab.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-foreground border-border hover:bg-secondary/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Monthly summary controls */}
      {activeReport === "summary" && (
        <div className="flex gap-3 flex-wrap items-center">
          <Select
            value={String(summaryMonth)}
            onValueChange={(v) => setSummaryMonth(Number(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(summaryYear)}
            onValueChange={(v) => setSummaryYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={exportPDF}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white"
          data-ocid="reports.pdf.button"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Export PDF
        </Button>
        <Button
          onClick={exportExcel}
          disabled={isLoading}
          className="bg-green-700 hover:bg-green-800 text-white"
          data-ocid="reports.excel.button"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Preview table */}
      {isLoading ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="reports.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading data...
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto bg-white shadow-sm">
          {activeReport === "members" && (
            <table className="w-full text-sm" data-ocid="reports.members.table">
              <thead className="bg-secondary/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">
                    Member ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold">Address</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Monthly Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {(members ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No members found
                    </td>
                  </tr>
                ) : (
                  (members ?? []).map((m) => (
                    <tr
                      key={String(m.memberId)}
                      className="border-b border-border last:border-0 hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{String(m.memberId)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.address || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        &#8377;{Number(m.monthlyFee).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === "payments" && (
            <table
              className="w-full text-sm"
              data-ocid="reports.payments.table"
            >
              <thead className="bg-secondary/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">
                    Payment ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Member</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Month / Year
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No payments recorded
                    </td>
                  </tr>
                ) : (
                  (payments ?? []).map((p) => (
                    <tr
                      key={String(p.paymentId)}
                      className="border-b border-border last:border-0 hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{String(p.paymentId)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {memberMap.get(String(p.memberId))?.name ??
                          `#${String(p.memberId)}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {MONTHS[Number(p.month) - 1]} {Number(p.year)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        &#8377;{Number(p.amountPaid).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(p.status)}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.paymentMode}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === "summary" && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 divide-x border-b">
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Fee Due</p>
                  <p className="font-bold text-foreground">
                    &#8377;
                    {summaryData
                      .reduce((s, r) => s + r.monthlyFee, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p className="font-bold text-green-700">
                    &#8377;
                    {summaryData
                      .reduce((s, r) => s + r.amountPaid, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="font-bold text-red-600">
                    &#8377;
                    {(
                      summaryData.reduce((s, r) => s + r.monthlyFee, 0) -
                      summaryData.reduce((s, r) => s + r.amountPaid, 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <table
                className="w-full text-sm"
                data-ocid="reports.summary.table"
              >
                <thead className="bg-secondary/60 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">
                      Member ID
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-right px-4 py-3 font-semibold">
                      Fee (&#8377;)
                    </th>
                    <th className="text-right px-4 py-3 font-semibold">
                      Paid (&#8377;)
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No members found
                      </td>
                    </tr>
                  ) : (
                    summaryData.map((r) => (
                      <tr
                        key={r.memberId}
                        className="border-b border-border last:border-0 hover:bg-secondary/20"
                      >
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            #{r.memberId}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-right">
                          {r.monthlyFee.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {r.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.paymentMode}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Unused import kept for tree-shaking purposes */}
      <span className="hidden">
        <Download className="w-0 h-0" />
      </span>
    </div>
  );
}
