import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Printer, X } from "lucide-react";
import type { Member, Payment } from "../backend";

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

interface Props {
  payment: Payment;
  member: Member;
  onClose: () => void;
}

function formatDate(paymentDate: bigint): string {
  const ms = Number(paymentDate) / 1_000_000;
  if (ms <= 0)
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function receiptNumber(paymentId: bigint): string {
  const s = String(paymentId);
  return `RCP-${s.slice(-6).padStart(6, "0")}`;
}

function getReceiptHTML(payment: Payment, member: Member): string {
  const receiptNo = receiptNumber(payment.paymentId);
  const dateStr = formatDate(payment.paymentDate);
  const monthYear = `${MONTHS[Number(payment.month) - 1]} ${Number(payment.year)}`;
  const amount = Number(payment.amountPaid).toLocaleString("en-IN");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; }
    .receipt { background: white; width: 100%; max-width: 500px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    .header { background: #00A859; color: white; text-align: center; padding: 28px 24px 20px; }
    .header h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
    .header p { font-size: 12px; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase; }
    .receipt-no { background: #1E3A8A; color: white; text-align: center; padding: 10px 24px; font-size: 13px; font-weight: 600; letter-spacing: 1px; }
    .body { padding: 24px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
    .label { font-size: 12px; color: #666; min-width: 120px; }
    .value { font-size: 13px; font-weight: 600; color: #1a1a1a; text-align: right; word-break: break-word; max-width: 280px; }
    .divider { border: none; border-top: 1px dashed #ddd; margin: 16px 0; }
    .amount-row .value { font-size: 20px; font-weight: 700; color: #00A859; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .footer { background: #f8fdf9; border-top: 2px solid #00A859; text-align: center; padding: 18px 24px; }
    .footer p { font-size: 13px; color: #374151; font-style: italic; }
    @media print {
      body { padding: 0; background: white; }
      .receipt { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Tengakhat Masjid Committee</h1>
      <p>Official Payment Receipt</p>
    </div>
    <div class="receipt-no">Receipt No: ${receiptNo} &nbsp;|&nbsp; Date: ${dateStr}</div>
    <div class="body">
      <div class="section">
        <div class="section-title">Member Details</div>
        <div class="row"><span class="label">Member Name</span><span class="value">${member.name}</span></div>
        <div class="row"><span class="label">Member ID</span><span class="value">#${Number(member.memberId)}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${member.phone}</span></div>
        <div class="row"><span class="label">Address</span><span class="value">${member.address}</span></div>
      </div>
      <hr class="divider" />
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="row"><span class="label">Period</span><span class="value">${monthYear}</span></div>
        <div class="row amount-row"><span class="label">Amount Paid</span><span class="value">₹${amount}</span></div>
        <div class="row"><span class="label">Payment Mode</span><span class="value">${payment.paymentMode}</span></div>
        <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span></span></div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your contribution. May Allah bless you.</p>
    </div>
  </div>
</body>
</html>`;
}

export default function ReceiptModal({ payment, member, onClose }: Props) {
  const receiptNo = receiptNumber(payment.paymentId);
  const dateStr = formatDate(payment.paymentDate);
  const monthYear = `${MONTHS[Number(payment.month) - 1]} ${Number(payment.year)}`;
  const amount = Number(payment.amountPaid).toLocaleString("en-IN");

  function handlePrint() {
    const html = getReceiptHTML(payment, member);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  }

  function handleDownloadPDF() {
    const html = getReceiptHTML(payment, member);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden"
          data-ocid="receipt.dialog"
        >
          {/* Header */}
          <div
            className="text-white text-center py-6 px-6"
            style={{ background: "#00A859" }}
          >
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Tengakhat Masjid Committee
            </h2>
            <p className="text-xs opacity-90 tracking-widest uppercase mt-1">
              Official Payment Receipt
            </p>
          </div>

          {/* Receipt number bar */}
          <div
            className="text-white text-center py-2.5 px-4 text-sm font-semibold tracking-wide"
            style={{ background: "#1E3A8A" }}
          >
            Receipt No: {receiptNo} &nbsp;|&nbsp; Date: {dateStr}
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 bg-white">
            {/* Member details */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Member Details
              </p>
              <div className="space-y-1.5">
                <Row label="Member Name" value={member.name} />
                <Row label="Member ID" value={`#${Number(member.memberId)}`} />
                <Row label="Phone" value={member.phone} />
                <Row label="Address" value={member.address} />
              </div>
            </div>

            <hr className="border-dashed border-border" />

            {/* Payment details */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Payment Details
              </p>
              <div className="space-y-1.5">
                <Row label="Period" value={monthYear} />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Amount Paid
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "#00A859" }}
                  >
                    ₹{amount}
                  </span>
                </div>
                <Row label="Payment Mode" value={payment.paymentMode} />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusPill status={payment.status} />
                </div>
              </div>
            </div>

            <hr className="border-dashed border-border" />

            {/* Footer message */}
            <p className="text-center text-sm text-muted-foreground italic">
              Thank you for your contribution. May Allah bless you.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 p-4 border-t bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              data-ocid="receipt.close_button"
              onClick={onClose}
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="receipt.print.button"
                onClick={handlePrint}
                className="gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                size="sm"
                data-ocid="receipt.download.button"
                onClick={handleDownloadPDF}
                className="gap-1.5 text-white"
                style={{ background: "#00A859" }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Partial"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}
    >
      {status}
    </span>
  );
}
