import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Hash,
  LogOut,
  Phone,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiGooglepay, SiPaytm, SiPhonepe } from "react-icons/si";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  Variant_active_inactive,
  formatAmount,
  formatDate,
  useCallerProfile,
  useMemberByPhone,
  usePaymentHistory,
  useRecordPayment,
  useUPIConfig,
  useYearlyBalance,
} from "../hooks/useQueries";

interface Props {
  onLogout: () => void;
}

export default function MemberDashboard({ onLogout }: Props) {
  const { clear } = useInternetIdentity();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const phone = profile?.phone ?? "";
  const { data: member, isLoading: memberLoading } = useMemberByPhone(phone);
  const { data: payments = [], isLoading: paymentsLoading } =
    usePaymentHistory(phone);
  const { data: upiConfig } = useUPIConfig();
  const currentYear = new Date().getFullYear();
  const { data: yearlyBalance } = useYearlyBalance(phone, currentYear);

  const recordPayment = useRecordPayment();

  const handleLogout = () => {
    clear();
    onLogout();
  };

  const buildUPILink = (app: "gpay" | "phonepe" | "paytm") => {
    if (!upiConfig || !member) return "#";
    const pa = encodeURIComponent(upiConfig.upi_id);
    const pn = encodeURIComponent(upiConfig.merchant_name);
    const am = String(member.monthly_amount);
    const tn = encodeURIComponent(upiConfig.description);
    switch (app) {
      case "gpay":
        return `tez://upi/pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}`;
      case "phonepe":
        return `phonepe://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}`;
      case "paytm":
        return `paytmmp://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}`;
    }
  };

  const handleMarkPaid = async () => {
    if (!member) return;
    setMarkingPaid(true);
    try {
      await recordPayment.mutateAsync({
        member_phone: phone,
        amount: Number(member.monthly_amount),
        note: "Self-reported payment",
      });
      setPaymentSuccess(true);
      toast.success("Payment marked as paid!");
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setMarkingPaid(false);
    }
  };

  const isLoading = profileLoading || memberLoading;
  const yearlyTarget = member ? Number(member.monthly_amount) * 12 : 0;
  const yearlyPaid = yearlyBalance !== undefined ? Number(yearlyBalance) : 0;
  const balancePositive = yearlyPaid >= yearlyTarget;

  return (
    <div
      className="min-h-screen font-poppins"
      style={{
        background: "linear-gradient(135deg, #0B2A5B 0%, #071D3F 100%)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-gold/20"
        style={{
          background: "rgba(11,42,91,0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gold overflow-hidden">
              <img
                src="/assets/generated/tmc-logo-transparent.dim_200x200.png"
                alt="TMC"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-gold font-bold text-xs leading-tight">
                TENGAKHAT MASJID COMMITTEE
              </p>
              <p className="text-white/50 text-xs">Member Portal</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
            onClick={handleLogout}
            data-ocid="member.logout.button"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isLoading ? (
          <div className="space-y-4" data-ocid="member.loading_state">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Top: Profile + Payment side by side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 border border-gold/20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,106,59,0.3), rgba(10,106,59,0.15))",
                }}
                data-ocid="member.profile.card"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center flex-shrink-0">
                    <User size={28} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-xl truncate">
                      {member?.name ?? profile?.name ?? "Member"}
                    </h2>
                    {member && (
                      <Badge
                        className={
                          member.status === Variant_active_inactive.active
                            ? "bg-green-500/20 text-green-300 border-green-500/30 mt-1"
                            : "bg-red-500/20 text-red-300 border-red-500/30 mt-1"
                        }
                      >
                        {member.status === Variant_active_inactive.active
                          ? "Active Member"
                          : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: Hash,
                      label: "Serial No.",
                      value: member ? `#${String(member.serial_no)}` : "—",
                    },
                    { icon: Phone, label: "Phone", value: phone || "—" },
                    {
                      icon: TrendingUp,
                      label: "Monthly Contribution",
                      value: member ? formatAmount(member.monthly_amount) : "—",
                    },
                    {
                      icon: Calendar,
                      label: "Member Since",
                      value: member ? formatDate(member.join_date) : "—",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <row.icon
                        size={15}
                        className="text-gold/70 flex-shrink-0"
                      />
                      <span className="text-white/50 text-sm w-36">
                        {row.label}
                      </span>
                      <span className="text-white font-medium text-sm">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Yearly Balance */}
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">
                      Yearly Balance {currentYear}
                    </span>
                    {balancePositive ? (
                      <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                        <TrendingUp size={14} /> Paid Up
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400 text-sm font-semibold">
                        <TrendingDown size={14} /> Outstanding
                      </div>
                    )}
                  </div>
                  <div className="bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${balancePositive ? "bg-green-400" : "bg-yellow-400"}`}
                      style={{
                        width: `${Math.min(100, yearlyTarget > 0 ? (yearlyPaid / yearlyTarget) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-white/40 text-xs">
                      Paid: {formatAmount(BigInt(yearlyPaid))}
                    </span>
                    <span className="text-white/40 text-xs">
                      Target: {formatAmount(BigInt(yearlyTarget))}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Pay Now Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6 border border-gold/20"
                style={{ background: "rgba(11,42,91,0.7)" }}
                data-ocid="member.payment.card"
              >
                <h3 className="text-gold font-bold text-lg mb-2">
                  Pay Monthly Contribution
                </h3>
                {member && (
                  <div className="text-3xl font-extrabold text-white mb-1">
                    {formatAmount(member.monthly_amount)}
                  </div>
                )}
                <p className="text-white/50 text-sm mb-5">Due this month</p>

                {upiConfig ? (
                  <>
                    {/* UPI ID to copy */}
                    <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white/40 text-xs">UPI ID</p>
                        <p className="text-white font-mono text-sm">
                          {upiConfig.upi_id}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="p-2 text-gold/70 hover:text-gold transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(upiConfig.upi_id);
                          toast.success("UPI ID copied!");
                        }}
                        data-ocid="member.copy_upi.button"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    {/* UPI App Buttons */}
                    <div className="space-y-3 mb-4">
                      {[
                        {
                          app: "gpay" as const,
                          label: "Google Pay",
                          Icon: SiGooglepay,
                          color: "#4285F4",
                        },
                        {
                          app: "phonepe" as const,
                          label: "PhonePe",
                          Icon: SiPhonepe,
                          color: "#5F259F",
                        },
                        {
                          app: "paytm" as const,
                          label: "Paytm",
                          Icon: SiPaytm,
                          color: "#00BAF2",
                        },
                      ].map(({ app, label, Icon, color }) => (
                        <a
                          key={app}
                          href={buildUPILink(app)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
                          data-ocid={`member.${app}.button`}
                        >
                          <Icon size={22} style={{ color }} />
                          <span className="text-white font-medium flex-1">
                            Pay with {label}
                          </span>
                          <ExternalLink size={14} className="text-white/40" />
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 text-center">
                    <p className="text-yellow-300 text-sm">
                      UPI not configured. Contact admin to set up payments.
                    </p>
                  </div>
                )}

                {/* Mark as paid */}
                <Button
                  className={`w-full ${
                    paymentSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : "green-gradient hover:opacity-90"
                  } text-white font-semibold rounded-xl py-3 transition-all`}
                  onClick={handleMarkPaid}
                  disabled={markingPaid || !member}
                  data-ocid="member.mark_paid.button"
                >
                  {markingPaid ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Recording...
                    </div>
                  ) : paymentSuccess ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} />
                      Payment Recorded!
                    </div>
                  ) : (
                    "Mark as Paid (Self-report)"
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Payment History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gold/20 overflow-hidden"
              style={{ background: "rgba(11,42,91,0.6)" }}
              data-ocid="member.payments.section"
            >
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-gold font-bold text-lg">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(10,106,59,0.2)" }}>
                      {["#", "Amount", "Date", "UPI Txn ID", "Note"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-gold/70 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsLoading ? (
                      Array.from({ length: 3 }, (_, i) => i).map((i) => (
                        <tr key={`skeleton-${i}`}>
                          <td colSpan={5} className="px-4 py-2">
                            <Skeleton className="h-8" />
                          </td>
                        </tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-white/40"
                          data-ocid="member.payments.empty_state"
                        >
                          No payments recorded yet. Make your first
                          contribution!
                        </td>
                      </tr>
                    ) : (
                      payments.map((p, i) => (
                        <tr
                          key={String(p.id)}
                          className="border-t border-white/5 hover:bg-white/5"
                          data-ocid={`member.payment.item.${i + 1}`}
                        >
                          <td className="px-4 py-3 text-gold/60">
                            #{String(p.id)}
                          </td>
                          <td className="px-4 py-3 text-green-300 font-semibold">
                            {formatAmount(p.amount)}
                          </td>
                          <td className="px-4 py-3 text-white/60">
                            {formatDate(p.date)}
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs font-mono">
                            {p.upi_txn_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {p.note ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-6 px-4 mt-8">
        <p className="text-center text-white/20 text-xs">
          © {new Date().getFullYear()} Tengakhat Masjid Committee ·{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-gold/30 hover:text-gold/60 transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
