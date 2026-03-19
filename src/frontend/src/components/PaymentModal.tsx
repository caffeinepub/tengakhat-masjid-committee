import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Member, Payment } from "../backend";
import { useAddPayment, usePaymentsByMonthYear } from "../hooks/useQueries";
import ReceiptModal from "./ReceiptModal";
import UpiPaymentPanel from "./UpiPaymentPanel";

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

interface Props {
  member: Member;
  defaultMonth?: number;
  defaultYear?: number;
  onClose: () => void;
}

export default function PaymentModal({
  member,
  defaultMonth,
  defaultYear,
  onClose,
}: Props) {
  const [month, setMonth] = useState(defaultMonth ?? currentMonth);
  const [year, setYear] = useState(defaultYear ?? currentYear);
  const [amountPaid, setAmountPaid] = useState(String(member.monthlyFee));
  const [status, setStatus] = useState("Paid");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [formError, setFormError] = useState("");
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const addPayment = useAddPayment();
  const { data: existing } = usePaymentsByMonthYear(month, year);

  const existingPayment = existing?.find(
    (p) => String(p.memberId) === String(member.memberId),
  );

  const upiAmount = Number(amountPaid) || Number(member.monthlyFee);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const amount = Number.parseInt(amountPaid, 10);
    if (Number.isNaN(amount) || amount < 0) {
      setFormError("Amount must be a valid non-negative number.");
      return;
    }
    try {
      const paymentId = await addPayment.mutateAsync({
        memberId: member.memberId,
        month,
        year,
        amountPaid: amount,
        status,
        paymentMode,
      });
      toast.success(`Payment recorded for ${member.name}`);
      // Build a synthetic payment object for the receipt
      const syntheticPayment: Payment = {
        paymentId:
          typeof paymentId === "bigint" ? paymentId : BigInt(Date.now()),
        memberId: member.memberId,
        month: BigInt(month),
        year: BigInt(year),
        amountPaid: BigInt(amount),
        status,
        paymentMode,
        paymentDate: BigInt(Date.now()) * 1_000_000n,
      };
      setReceiptPayment(syntheticPayment);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFormError(`Failed to record payment: ${msg}`);
      toast.error("Failed to record payment");
    }
  }

  if (receiptPayment) {
    return (
      <ReceiptModal
        payment={receiptPayment}
        member={member}
        onClose={onClose}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        data-ocid="payments.record.dialog"
      >
        <DialogHeader>
          <DialogTitle>Record Payment — {member.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {existingPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ A payment already exists for this month (₹
              {Number(existingPayment.amountPaid).toLocaleString()},{" "}
              {existingPayment.status}). Adding another will create a new
              record.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Month</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
              >
                <SelectTrigger data-ocid="payments.month.select">
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
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
              >
                <SelectTrigger data-ocid="payments.year.select">
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

          <div className="space-y-1.5">
            <Label htmlFor="p-amount">Amount Paid (₹) *</Label>
            <Input
              id="p-amount"
              data-ocid="payments.amount.input"
              type="number"
              min="0"
              placeholder={`Monthly fee: ₹${Number(member.monthlyFee).toLocaleString()}`}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Payment Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-ocid="payments.status.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Mode *</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger data-ocid="payments.mode.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">
                  UPI (GPay / PhonePe / Paytm)
                </SelectItem>
                <SelectItem value="Card">Debit / Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMode === "UPI" && (
            <UpiPaymentPanel memberName={member.name} amount={upiAmount} />
          )}

          {formError && (
            <p
              data-ocid="payments.form.error_state"
              className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
            >
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="payments.record.cancel_button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="payments.record.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={addPayment.isPending}
            >
              {addPayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
