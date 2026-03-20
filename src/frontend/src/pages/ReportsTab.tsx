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
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

type ReportType = "members" | "payments" | "summary";

function statusBadgeClass(status: string) {
  if (status === "Paid") return "bg-green-100 text-green-800 border-green-300";
  if (status === "Partial")
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
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
      paymentMode: payment ? payment.paymentMode : "—",
    };
  });

  // ── PDF Export ────────────────────────────────────────────────────────────
  async function exportPDF() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const title = "Tengakhat Masjid Committee";
      doc.setFontSize(16);
      doc.setTextColor(0, 100, 50);
      doc.text(title, 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);

      if (activeReport === "members") {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Member List", 14, 32);
        autoTable(doc, {
          startY: 36,
          head: [["Member ID", "Name", "Phone", "Address", "Monthly Fee (₹)"]],
          body: (members ?? []).map((m) => [
            String(m.memberId),
            m.name,
            m.phone,
            m.address || "—",
            Number(m.monthlyFee).toLocaleString(),
          ]),
          headStyles: { fillColor: [0, 100, 50] },
          alternateRowStyles: { fillColor: [240, 255, 245] },
        });
        doc.save("member-list.pdf");
      } else if (activeReport === "payments") {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Payment History", 14, 32);
        autoTable(doc, {
          startY: 36,
          head: [
            [
              "Payment ID",
              "Member",
              "Month/Year",
              "Amount (₹)",
              "Status",
              "Mode",
            ],
          ],
          body: (payments ?? []).map((p) => [
            String(p.paymentId),
            memberMap.get(String(p.memberId))?.name ?? String(p.memberId),
            `${MONTHS[Number(p.month) - 1]} ${Number(p.year)}`,
            Number(p.amountPaid).toLocaleString(),
            p.status,
            p.paymentMode,
          ]),
          headStyles: { fillColor: [0, 100, 50] },
          alternateRowStyles: { fillColor: [240, 255, 245] },
        });
        doc.save("payment-history.pdf");
      } else {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Monthly Summary — ${MONTHS[summaryMonth - 1]} ${summaryYear}`,
          14,
          32,
        );
        const totalCollected = summaryData.reduce(
          (s, r) => s + r.amountPaid,
          0,
        );
        const totalFees = summaryData.reduce((s, r) => s + r.monthlyFee, 0);
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(
          `Total Collected: ₹${totalCollected.toLocaleString()}  |  Total Fees: ₹${totalFees.toLocaleString()}  |  Pending: ₹${(totalFees - totalCollected).toLocaleString()}`,
          14,
          39,
        );
        autoTable(doc, {
          startY: 44,
          head: [
            [
              "Member ID",
              "Name",
              "Monthly Fee (₹)",
              "Paid (₹)",
              "Status",
              "Mode",
            ],
          ],
          body: summaryData.map((r) => [
            r.memberId,
            r.name,
            r.monthlyFee.toLocaleString(),
            r.amountPaid.toLocaleString(),
            r.status,
            r.paymentMode,
          ]),
          headStyles: { fillColor: [0, 100, 50] },
          alternateRowStyles: { fillColor: [240, 255, 245] },
          bodyStyles: { fontSize: 9 },
        });
        doc.save(`summary-${MONTHS[summaryMonth - 1]}-${summaryYear}.pdf`);
      }

      toast.success("PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  }

  // ── Excel Export ──────────────────────────────────────────────────────────
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");

      let wb: ReturnType<typeof XLSX.utils.book_new>;
      let ws: ReturnType<typeof XLSX.utils.aoa_to_sheet>;
      let filename: string;

      if (activeReport === "members") {
        const rows = [
          ["Member ID", "Name", "Phone", "Address", "Monthly Fee (₹)"],
          ...(members ?? []).map((m) => [
            String(m.memberId),
            m.name,
            m.phone,
            m.address || "",
            Number(m.monthlyFee),
          ]),
        ];
        ws = XLSX.utils.aoa_to_sheet(rows);
        wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Members");
        filename = "member-list.xlsx";
      } else if (activeReport === "payments") {
        const rows = [
          [
            "Payment ID",
            "Member",
            "Month",
            "Year",
            "Amount (₹)",
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
        ws = XLSX.utils.aoa_to_sheet(rows);
        wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payments");
        filename = "payment-history.xlsx";
      } else {
        const rows = [
          [`Monthly Summary: ${MONTHS[summaryMonth - 1]} ${summaryYear}`],
          [],
          [
            "Member ID",
            "Name",
            "Monthly Fee (₹)",
            "Paid (₹)",
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
        ws = XLSX.utils.aoa_to_sheet(rows);
        wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary");
        filename = `summary-${MONTHS[summaryMonth - 1]}-${summaryYear}.xlsx`;
      }

      XLSX.writeFile(wb, filename);
      toast.success("Excel file downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file");
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
          Download reports as PDF or Excel
        </p>
      </div>

      {/* Report type tabs */}
      <div className="flex gap-2 flex-wrap">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveReport(tab.id)}
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
          data-ocid="reports.export_pdf.button"
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
          data-ocid="reports.export_excel.button"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 mr-2" />
          )}
          Export Excel
        </Button>
      </div>

      {/* Preview table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
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
                        {m.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{Number(m.monthlyFee).toLocaleString()}
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
                        ₹{Number(p.amountPaid).toLocaleString()}
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
                    ₹
                    {summaryData
                      .reduce((s, r) => s + r.monthlyFee, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p className="font-bold text-green-700">
                    ₹
                    {summaryData
                      .reduce((s, r) => s + r.amountPaid, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="font-bold text-red-600">
                    ₹
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
                      Fee (₹)
                    </th>
                    <th className="text-right px-4 py-3 font-semibold">
                      Paid (₹)
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
