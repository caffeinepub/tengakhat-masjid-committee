import { AlertTriangle, Smartphone } from "lucide-react";

interface Props {
  memberName: string;
  amount: number;
}

function buildUpiUrl(
  schema: string,
  upiId: string,
  amount: number,
  memberName: string,
) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: "Tengakhat Masjid Committee",
    am: String(amount),
    cu: "INR",
    tn: `Fee for ${memberName}`,
  });
  return `${schema}?${params.toString()}`;
}

const UPI_APPS = [
  {
    name: "GPay",
    schema: "gpay://upi/pay",
    color: "#4285F4",
    textColor: "#ffffff",
  },
  {
    name: "PhonePe",
    schema: "phonepe://pay",
    color: "#5f259f",
    textColor: "#ffffff",
  },
  {
    name: "Paytm",
    schema: "paytmmp://pay",
    color: "#00BAF2",
    textColor: "#ffffff",
  },
];

export default function UpiPaymentPanel({ memberName, amount }: Props) {
  const upiId = localStorage.getItem("tmc_upi_id");

  if (!upiId) {
    return (
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-0.5">UPI ID not configured</p>
          <p>
            Go to <span className="font-medium">Settings</span> tab to enter the
            committee&apos;s UPI ID before accepting UPI payments.
          </p>
        </div>
      </div>
    );
  }

  const upiUrl = buildUpiUrl("upi://pay", upiId, amount, memberName);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}&color=1E3A8A`;

  return (
    <div className="mt-3 space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-2 bg-gray-50 rounded-xl p-4 border border-border">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Scan to Pay
        </p>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-border">
          <img
            src={qrSrc}
            alt="UPI QR Code"
            width={180}
            height={180}
            className="block"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          UPI ID:{" "}
          <span className="font-mono font-medium text-foreground">{upiId}</span>
        </p>
        <p className="text-sm font-semibold text-primary">
          ₹{amount.toLocaleString()}
        </p>
      </div>

      {/* App Buttons */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">
            Or open payment app directly
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {UPI_APPS.map((app) => {
            const url = buildUpiUrl(app.schema, upiId, amount, memberName);
            return (
              <a
                key={app.name}
                href={url}
                data-ocid={`upi.${app.name.toLowerCase()}.button`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center py-2.5 px-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
                style={{ backgroundColor: app.color, color: app.textColor }}
              >
                {app.name}
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Scan the QR code or tap a button to open the payment app. After payment,
        mark status as <span className="font-medium">Paid</span> above.
      </p>
    </div>
  );
}
