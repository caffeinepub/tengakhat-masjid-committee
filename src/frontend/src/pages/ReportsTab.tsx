import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@dfinity/principal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useActor } from "../hooks/useActor";
import { useMembers } from "../hooks/useQueries";
import type { Member, PaymentRecord } from "../hooks/useQueries";

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
const YEARS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - i));

type AllPaymentsMap = Record<string, PaymentRecord[]>;

interface PaymentRow {
  memberName: string;
  month: number;
  year: number;
  amount: number;
  note: string;
}

function pdfHeader(doc: jsPDF, title: string) {
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // navy
  doc.text("TENGAKHAT MASJID COMMITTEE", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 32);
}

// ──────────────────────────────────────────────
// Member List Report
// ──────────────────────────────────────────────
function MemberListReport({ members }: { members: [Principal, Member][] }) {
  const rows = members.map(([, m]) => ({
    name: m.name,
    phone: m.phone,
    monthly: Number(m.monthlyContribution),
    balance: Number(m.balance),
  }));

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    pdfHeader(doc, "Member List Report");
    autoTable(doc, {
      startY: 38,
      head: [["#", "Name", "Phone", "Monthly Contribution (₹)", "Balance (₹)"]],
      body: rows.map((r, i) => [
        i + 1,
        r.name,
        r.phone,
        `₹${r.monthly}`,
        `₹${r.balance}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save("member-list.pdf");
  };

  const downloadExcel = () => {
    const data = [
      ["#", "Name", "Phone", "Monthly Contribution (₹)", "Balance (₹)"],
      ...rows.map((r, i) => [i + 1, r.name, r.phone, r.monthly, r.balance]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "member-list.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-white/50 text-sm">{rows.length} members</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="btn-gold gap-1.5"
            onClick={downloadPDF}
            data-ocid="reports.members.pdf_button"
          >
            <FileText size={14} />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-1.5"
            onClick={downloadExcel}
            data-ocid="reports.members.excel_button"
          >
            <FileSpreadsheet size={14} />
            Excel
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          className="glass-card-navy rounded-2xl p-10 text-center"
          data-ocid="reports.members.empty_state"
        >
          <p className="text-white/40">No members found.</p>
        </div>
      ) : (
        <div className="glass-card-navy rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gold/80">#</TableHead>
                <TableHead className="text-gold/80">Name</TableHead>
                <TableHead className="text-gold/80 hidden sm:table-cell">
                  Phone
                </TableHead>
                <TableHead className="text-gold/80">Monthly (₹)</TableHead>
                <TableHead className="text-gold/80">Balance (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow
                  key={r.name}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`reports.members.item.${i + 1}`}
                >
                  <TableCell className="text-white/60 font-mono text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-white/60 hidden sm:table-cell">
                    {r.phone}
                  </TableCell>
                  <TableCell className="text-white/70">₹{r.monthly}</TableCell>
                  <TableCell className="text-white/70">₹{r.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Payment History Report
// ──────────────────────────────────────────────
function PaymentHistoryReport({
  members,
  allPayments,
  loadingPayments,
}: {
  members: [Principal, Member][];
  allPayments: AllPaymentsMap;
  loadingPayments: boolean;
}) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [fromMonth, setFromMonth] = useState(String(1));
  const [fromYear, setFromYear] = useState(String(currentYear));
  const [toMonth, setToMonth] = useState(String(currentMonth));
  const [toYear, setToYear] = useState(String(currentYear));

  const allRows: PaymentRow[] = [];
  for (const [principal, member] of members) {
    const payments = allPayments[principal.toString()] ?? [];
    for (const p of payments) {
      allRows.push({
        memberName: member.name,
        month: Number(p.month),
        year: Number(p.year),
        amount: Number(p.amount),
        note: p.note,
      });
    }
  }

  const filteredRows = allRows
    .filter((r) => {
      const rVal = r.year * 12 + r.month;
      const fromVal = Number(fromYear) * 12 + Number(fromMonth);
      const toVal = Number(toYear) * 12 + Number(toMonth);
      return rVal >= fromVal && rVal <= toVal;
    })
    .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    pdfHeader(doc, "Payment History Report");
    autoTable(doc, {
      startY: 38,
      head: [["Date", "Member Name", "Amount (₹)", "Note"]],
      body: filteredRows.map((r) => [
        `${MONTHS[r.month - 1]} ${r.year}`,
        r.memberName,
        `₹${r.amount}`,
        r.note || "-",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save("payment-history.pdf");
  };

  const downloadExcel = () => {
    const data = [
      ["Date", "Member Name", "Amount (₹)", "Note"],
      ...filteredRows.map((r) => [
        `${MONTHS[r.month - 1]} ${r.year}`,
        r.memberName,
        r.amount,
        r.note || "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "payment-history.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-card-navy rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">From Month</Label>
          <Select value={fromMonth} onValueChange={setFromMonth}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-8 text-sm"
              data-ocid="reports.payments.from_month_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {MONTHS.map((m, i) => (
                <SelectItem
                  key={m}
                  value={String(i + 1)}
                  className="text-white hover:bg-white/10"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">From Year</Label>
          <Select value={fromYear} onValueChange={setFromYear}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-8 text-sm"
              data-ocid="reports.payments.from_year_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {YEARS.map((y) => (
                <SelectItem
                  key={y}
                  value={y}
                  className="text-white hover:bg-white/10"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">To Month</Label>
          <Select value={toMonth} onValueChange={setToMonth}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-8 text-sm"
              data-ocid="reports.payments.to_month_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {MONTHS.map((m, i) => (
                <SelectItem
                  key={m}
                  value={String(i + 1)}
                  className="text-white hover:bg-white/10"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">To Year</Label>
          <Select value={toYear} onValueChange={setToYear}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-8 text-sm"
              data-ocid="reports.payments.to_year_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {YEARS.map((y) => (
                <SelectItem
                  key={y}
                  value={y}
                  className="text-white hover:bg-white/10"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-white/50 text-sm">
          {loadingPayments
            ? "Loading..."
            : `${filteredRows.length} payment records`}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="btn-gold gap-1.5"
            onClick={downloadPDF}
            disabled={loadingPayments}
            data-ocid="reports.payments.pdf_button"
          >
            <FileText size={14} />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-1.5"
            onClick={downloadExcel}
            disabled={loadingPayments}
            data-ocid="reports.payments.excel_button"
          >
            <FileSpreadsheet size={14} />
            Excel
          </Button>
        </div>
      </div>

      {loadingPayments ? (
        <div className="space-y-2" data-ocid="reports.payments.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/10" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div
          className="glass-card-navy rounded-2xl p-10 text-center"
          data-ocid="reports.payments.empty_state"
        >
          <p className="text-white/40">No payments in selected range.</p>
        </div>
      ) : (
        <div className="glass-card-navy rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gold/80">Date</TableHead>
                <TableHead className="text-gold/80">Member</TableHead>
                <TableHead className="text-gold/80">Amount (₹)</TableHead>
                <TableHead className="text-gold/80 hidden sm:table-cell">
                  Note
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r, i) => (
                <TableRow
                  key={`${r.memberName}-${r.year}-${r.month}`}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`reports.payments.item.${i + 1}`}
                >
                  <TableCell className="text-white/70 text-sm">
                    {MONTHS[r.month - 1]} {r.year}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {r.memberName}
                  </TableCell>
                  <TableCell className="text-gold font-semibold">
                    ₹{r.amount}
                  </TableCell>
                  <TableCell className="text-white/40 text-sm hidden sm:table-cell">
                    {r.note || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Monthly Summary Report
// ──────────────────────────────────────────────
function MonthlySummaryReport({
  members,
  allPayments,
  loadingPayments,
}: {
  members: [Principal, Member][];
  allPayments: AllPaymentsMap;
  loadingPayments: boolean;
}) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selMonth, setSelMonth] = useState(String(currentMonth));
  const [selYear, setSelYear] = useState(String(currentYear));

  const summaryRows = members.map(([principal, member]) => {
    const payments = allPayments[principal.toString()] ?? [];
    const payment = payments.find(
      (p) =>
        Number(p.month) === Number(selMonth) &&
        Number(p.year) === Number(selYear),
    );
    return {
      name: member.name,
      paid: !!payment,
      amount: payment
        ? Number(payment.amount)
        : Number(member.monthlyContribution),
    };
  });

  const totalPaid = summaryRows.filter((r) => r.paid).length;
  const totalUnpaid = summaryRows.filter((r) => !r.paid).length;

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    pdfHeader(
      doc,
      `Monthly Summary — ${MONTHS[Number(selMonth) - 1]} ${selYear}`,
    );
    autoTable(doc, {
      startY: 38,
      head: [["#", "Name", "Status", "Amount (₹)"]],
      body: summaryRows.map((r, i) => [
        i + 1,
        r.name,
        r.paid ? "Paid" : "Unpaid",
        `₹${r.amount}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
      bodyStyles: {},
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === "body") {
          const isPaid = data.cell.raw === "Paid";
          data.cell.styles.textColor = isPaid ? [34, 197, 94] : [239, 68, 68];
        }
      },
    });
    doc.save(`monthly-summary-${selMonth}-${selYear}.pdf`);
  };

  const downloadExcel = () => {
    const data = [
      ["#", "Name", "Status", "Amount (₹)"],
      ...summaryRows.map((r, i) => [
        i + 1,
        r.name,
        r.paid ? "Paid" : "Unpaid",
        r.amount,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, `monthly-summary-${selMonth}-${selYear}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Month/Year Selector */}
      <div className="glass-card-navy rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">Month</Label>
          <Select value={selMonth} onValueChange={setSelMonth}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-9 w-36"
              data-ocid="reports.summary.month_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {MONTHS.map((m, i) => (
                <SelectItem
                  key={m}
                  value={String(i + 1)}
                  className="text-white hover:bg-white/10"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-white/60 text-xs">Year</Label>
          <Select value={selYear} onValueChange={setSelYear}>
            <SelectTrigger
              className="bg-white/10 border-white/20 text-white h-9 w-28"
              data-ocid="reports.summary.year_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              {YEARS.map((y) => (
                <SelectItem
                  key={y}
                  value={y}
                  className="text-white hover:bg-white/10"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 ml-auto">
          <div className="text-center">
            <p className="text-green-400 font-bold text-lg">{totalPaid}</p>
            <p className="text-white/40 text-xs">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 font-bold text-lg">{totalUnpaid}</p>
            <p className="text-white/40 text-xs">Unpaid</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-white/50 text-sm">
          {MONTHS[Number(selMonth) - 1]} {selYear}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="btn-gold gap-1.5"
            onClick={downloadPDF}
            disabled={loadingPayments}
            data-ocid="reports.summary.pdf_button"
          >
            <FileText size={14} />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-1.5"
            onClick={downloadExcel}
            disabled={loadingPayments}
            data-ocid="reports.summary.excel_button"
          >
            <FileSpreadsheet size={14} />
            Excel
          </Button>
        </div>
      </div>

      {loadingPayments ? (
        <div className="space-y-2" data-ocid="reports.summary.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/10" />
          ))}
        </div>
      ) : summaryRows.length === 0 ? (
        <div
          className="glass-card-navy rounded-2xl p-10 text-center"
          data-ocid="reports.summary.empty_state"
        >
          <p className="text-white/40">No members found.</p>
        </div>
      ) : (
        <div className="glass-card-navy rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gold/80">#</TableHead>
                <TableHead className="text-gold/80">Name</TableHead>
                <TableHead className="text-gold/80">Status</TableHead>
                <TableHead className="text-gold/80">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryRows.map((r, i) => (
                <TableRow
                  key={r.name}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`reports.summary.item.${i + 1}`}
                >
                  <TableCell className="text-white/60 font-mono text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {r.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.paid
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {r.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/70">₹{r.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main ReportsTab
// ──────────────────────────────────────────────
export default function ReportsTab() {
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { actor, isFetching } = useActor();
  const [allPayments, setAllPayments] = useState<AllPaymentsMap>({});
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!actor || isFetching || members.length === 0) return;

    let cancelled = false;
    setLoadingPayments(true);

    const fetchAll = async () => {
      const results = await Promise.all(
        members.map(async ([principal]) => {
          const payments = await actor.getPaymentsByMember(principal);
          return [principal.toString(), payments] as [string, PaymentRecord[]];
        }),
      );
      if (!cancelled) {
        setAllPayments(Object.fromEntries(results));
        setLoadingPayments(false);
      }
    };

    fetchAll().catch(() => {
      if (!cancelled) setLoadingPayments(false);
    });

    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, members]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Reports &amp; Export</h2>
        <p className="text-white/50 text-sm">
          Generate and download PDF/Excel reports
        </p>
      </div>

      {membersLoading ? (
        <div className="space-y-3" data-ocid="reports.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/10" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="bg-white/10 gap-1 flex-wrap h-auto mb-5">
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5"
              data-ocid="reports.members_tab"
            >
              <Download size={13} />
              Member List
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5"
              data-ocid="reports.payments_tab"
            >
              {loadingPayments ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Payment History
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5"
              data-ocid="reports.summary_tab"
            >
              {loadingPayments ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Monthly Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <MemberListReport members={members} />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistoryReport
              members={members}
              allPayments={allPayments}
              loadingPayments={loadingPayments}
            />
          </TabsContent>

          <TabsContent value="summary">
            <MonthlySummaryReport
              members={members}
              allPayments={allPayments}
              loadingPayments={loadingPayments}
            />
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
