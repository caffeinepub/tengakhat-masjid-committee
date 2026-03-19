import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { Member, Payment } from "../backend";
import PaymentModal from "../components/PaymentModal";
import ReceiptModal from "../components/ReceiptModal";
import {
  useAllPayments,
  useMembers,
  usePaymentsByMonthYear,
} from "../hooks/useQueries";

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

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

function StatusBadge({ status }: { status: string }) {
  if (status === "Paid")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium status-paid">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    );
  if (status === "Partial")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium status-partial">
        <Clock className="w-3 h-3" /> Partial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium status-unpaid">
      <XCircle className="w-3 h-3" /> Unpaid
    </span>
  );
}

interface ReceiptTarget {
  payment: Payment;
  member: Member;
}

export default function PaymentsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [paymentTarget, setPaymentTarget] = useState<Member | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<ReceiptTarget | null>(
    null,
  );

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: monthlyPayments, isLoading: paymentsLoading } =
    usePaymentsByMonthYear(month, year);
  const { data: allPayments, isLoading: allLoading } = useAllPayments();

  // Map memberId -> payment for this month
  const paymentMap = new Map(
    (monthlyPayments ?? []).map((p) => [String(p.memberId), p]),
  );

  const loading = membersLoading || paymentsLoading;

  // Build member-payment rows
  const rows = (members ?? []).map((member) => ({
    member,
    payment: paymentMap.get(String(member.memberId)) ?? null,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payments</h2>
          <p className="text-muted-foreground text-sm">
            Monthly fee collection status
          </p>
        </div>

        {/* Month/Year selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger
              data-ocid="payments.month.filter.select"
              className="w-36"
            >
              <SelectValue />
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
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger
              data-ocid="payments.year.filter.select"
              className="w-28"
            >
              <SelectValue />
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
      </div>

      {/* Monthly Status Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {MONTHS[month - 1]} {year} — Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div data-ocid="payments.loading_state" className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div
              data-ocid="payments.empty_state"
              className="py-16 text-center text-muted-foreground"
            >
              <p className="text-4xl mb-3">💰</p>
              <p className="font-medium">No members found</p>
              <p className="text-sm mt-1">
                Add members first to track payments
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div
                className="hidden md:block overflow-x-auto"
                data-ocid="payments.table"
              >
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">
                        Member
                      </th>
                      <th className="text-right px-4 py-3 font-semibold">
                        Monthly Fee
                      </th>
                      <th className="text-right px-4 py-3 font-semibold">
                        Amount Paid
                      </th>
                      <th className="text-center px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th className="text-center px-4 py-3 font-semibold">
                        Mode
                      </th>
                      <th className="text-center px-4 py-3 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ member, payment }, idx) => (
                      <tr
                        key={String(member.memberId)}
                        data-ocid={`payments.item.${idx + 1}`}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ₹{Number(member.monthlyFee).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {payment
                            ? `₹${Number(payment.amountPaid).toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={payment?.status ?? "Unpaid"} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {payment ? (
                            <Badge variant="outline" className="text-xs">
                              {payment.paymentMode}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            data-ocid={`payments.item.${idx + 1}.button`}
                            onClick={() => setPaymentTarget(member)}
                            className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Record
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-4 space-y-3">
                {rows.map(({ member, payment }, idx) => (
                  <div
                    key={String(member.memberId)}
                    data-ocid={`payments.item.${idx + 1}`}
                    className="border border-border rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.phone}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={payment?.status ?? "Unpaid"} />
                          {payment && (
                            <span className="text-xs text-muted-foreground">
                              ₹{Number(payment.amountPaid).toLocaleString()} / ₹
                              {Number(member.monthlyFee).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid={`payments.item.${idx + 1}.button`}
                        onClick={() => setPaymentTarget(member)}
                        className="h-8 text-xs text-primary border-primary/30"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Record
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Full Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Full Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !allPayments || allPayments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="payments.history.table"
              >
                <thead className="bg-secondary/60 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">
                      Member
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Period
                    </th>
                    <th className="text-right px-4 py-3 font-semibold">
                      Amount
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Mode
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Date
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...allPayments]
                    .sort(
                      (a, b) => Number(b.paymentDate) - Number(a.paymentDate),
                    )
                    .map((payment, idx) => {
                      const member = members?.find(
                        (m) => String(m.memberId) === String(payment.memberId),
                      );
                      const dateMs = Number(payment.paymentDate) / 1_000_000;
                      const dateStr =
                        dateMs > 0
                          ? new Date(dateMs).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—";
                      return (
                        <tr
                          key={String(payment.paymentId)}
                          data-ocid={`payments.history.item.${idx + 1}`}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">
                            {member?.name ?? `#${String(payment.memberId)}`}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {MONTHS[Number(payment.month) - 1]}{" "}
                            {String(payment.year)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            ₹{Number(payment.amountPaid).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={payment.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-xs">
                              {payment.paymentMode}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {member ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                data-ocid={`payments.history.item.${idx + 1}.button`}
                                onClick={() =>
                                  setReceiptTarget({ payment, member })
                                }
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                title="View Receipt"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          member={paymentTarget}
          defaultMonth={month}
          defaultYear={year}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptTarget && (
        <ReceiptModal
          payment={receiptTarget.payment}
          member={receiptTarget.member}
          onClose={() => setReceiptTarget(null)}
        />
      )}
    </div>
  );
}
