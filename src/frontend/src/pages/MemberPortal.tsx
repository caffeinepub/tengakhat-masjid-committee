import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import UpiPaymentPanel from "../components/UpiPaymentPanel";
import { useAddPayment, useAllPayments, useMembers } from "../hooks/useQueries";

interface Props {
  memberId: string;
  onLogout: () => void;
}

type MemberTab = "profile" | "history" | "status" | "pay" | "prevbal" | "pin";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_FULL = [
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

const TAB_LIST: { id: MemberTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "history", label: "Pay History" },
  { id: "status", label: "Monthly Status" },
  { id: "pay", label: "Pay Now" },
  { id: "prevbal", label: "Prev. Balance" },
  { id: "pin", label: "Change PIN" },
];

function getPrevBalances(): Record<string, number> {
  return JSON.parse(localStorage.getItem("tmc_prev_balances") ?? "{}");
}

function ProfileSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center mb-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
    </div>
  );
}

export default function MemberPortal({ memberId, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<MemberTab>("profile");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [prevBalPayAmount, setPrevBalPayAmount] = useState<number>(0);
  // Counter to force re-read of localStorage after prev balance payment
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [payConfirmLoading, setPayConfirmLoading] = useState(false);
  const [prevBalConfirmLoading, setPrevBalConfirmLoading] = useState(false);

  const {
    data: allMembers,
    isLoading: membersLoading,
    isError: membersError,
  } = useMembers();
  const { data: allPayments } = useAllPayments();

  const addPayment = useAddPayment();

  const member = allMembers?.find((m) => String(m.memberId) === memberId);

  // Previous balance is stored in localStorage by admin
  // balanceRefresh dependency forces re-read after payment
  const prevBalances =
    balanceRefresh >= 0 ? getPrevBalances() : getPrevBalances();
  const memberPrevBal = prevBalances[memberId] ?? 0;

  const myPayments = (allPayments ?? []).filter(
    (p) => String(p.memberId) === memberId,
  );

  const photos: Record<string, string> = JSON.parse(
    localStorage.getItem("tmc_member_photos") ?? "{}",
  );
  const photo = photos[memberId];

  function handlePinChange(e: React.FormEvent) {
    e.preventDefault();
    setPinError("");
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }
    const pins: Record<string, string> = JSON.parse(
      localStorage.getItem("tmc_member_pins") ?? "{}",
    );
    pins[memberId] = newPin;
    localStorage.setItem("tmc_member_pins", JSON.stringify(pins));
    toast.success("PIN changed successfully!");
    setNewPin("");
    setConfirmPin("");
  }

  async function handleConfirmMonthlyPayment() {
    if (!member) return;
    setPayConfirmLoading(true);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    try {
      await addPayment.mutateAsync({
        memberId: member.memberId,
        month: currentMonth,
        year: currentYear,
        amountPaid: Number(member.monthlyFee),
        status: "Paid",
        paymentMode: "UPI",
      });
      toast.success(
        `Payment recorded! Your monthly fee for ${MONTHS_FULL[currentMonth - 1]} ${currentYear} has been updated.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to record payment: ${msg}`);
    }
    setPayConfirmLoading(false);
  }

  async function handleConfirmPrevBalPayment() {
    if (!member) return;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const payAmount =
      prevBalPayAmount > 0 && prevBalPayAmount <= memberPrevBal
        ? prevBalPayAmount
        : memberPrevBal;
    if (payAmount <= 0) return;
    setPrevBalConfirmLoading(true);
    try {
      await addPayment.mutateAsync({
        memberId: member.memberId,
        month: currentMonth,
        year: currentYear,
        amountPaid: payAmount,
        status: "Paid",
        paymentMode: "UPI",
      });
      // Deduct from localStorage
      const bals = getPrevBalances();
      const current = bals[memberId] ?? 0;
      bals[memberId] = Math.max(0, current - payAmount);
      localStorage.setItem("tmc_prev_balances", JSON.stringify(bals));
      setBalanceRefresh((n) => n + 1);
      setPrevBalPayAmount(0);
      toast.success(
        `Previous balance updated! ₹${payAmount.toLocaleString()} has been deducted from your outstanding balance.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to record payment: ${msg}`);
    }
    setPrevBalConfirmLoading(false);
  }

  const currentYear = new Date().getFullYear();

  function renderProfileContent() {
    if (membersLoading) {
      return <ProfileSkeleton />;
    }
    if (membersError) {
      return (
        <div
          className="flex flex-col items-center gap-3 py-10 px-4 rounded-lg text-center"
          style={{ background: "#fff5f5" }}
          data-ocid="profile.error_state"
        >
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Could not load profile data. Please check your connection or try
            again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      );
    }
    if (!member) {
      return (
        <div
          className="flex flex-col items-center gap-3 py-10 px-4 rounded-lg text-center"
          style={{ background: "#fffbeb" }}
          data-ocid="profile.empty_state"
        >
          <User className="w-8 h-8" style={{ color: "#92400e" }} />
          <p className="text-sm font-medium" style={{ color: "#92400e" }}>
            Profile not found. Please contact your admin to verify your Member
            ID.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center"
            style={{ borderColor: "#D4AF37" }}
          >
            {photo ? (
              <img
                src={photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "#e8f5ee" }}
              >
                <User className="w-12 h-12" style={{ color: "#006633" }} />
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Photo managed by admin
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: "#f0f9f4" }}>
            <p className="text-xs text-muted-foreground">Member ID</p>
            <p className="font-bold" style={{ color: "#004d26" }}>
              #{String(member.memberId)}
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#f0f9f4" }}>
            <p className="text-xs text-muted-foreground">Monthly Fee</p>
            <p className="font-bold" style={{ color: "#004d26" }}>
              ₹{Number(member.monthlyFee).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "#f0f9f4" }}>
          <p className="text-xs text-muted-foreground">Full Name</p>
          <p className="font-semibold">{member.name}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "#f0f9f4" }}>
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="font-semibold">{member.phone}</p>
        </div>
        {member.address && (
          <div className="p-3 rounded-lg" style={{ background: "#f0f9f4" }}>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-semibold">{member.address}</p>
          </div>
        )}
        {memberPrevBal > 0 && (
          <div
            className="p-3 rounded-lg border"
            style={{ background: "#fffbeb", borderColor: "#D4AF37" }}
          >
            <p className="text-xs text-amber-700 font-medium">
              Outstanding Previous Balance
            </p>
            <p className="font-bold text-amber-800">
              ₹{memberPrevBal.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderPayContent() {
    if (membersLoading) {
      return (
        <div className="space-y-3" data-ocid="pay.loading_state">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      );
    }
    if (membersError) {
      return (
        <div
          className="flex flex-col items-center gap-3 py-10 px-4 rounded-lg text-center"
          style={{ background: "#fff5f5" }}
          data-ocid="pay.error_state"
        >
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Could not load member data. Please check your connection or try
            again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      );
    }
    if (!member) {
      return (
        <p
          className="text-center text-muted-foreground py-8"
          data-ocid="pay.empty_state"
        >
          Member data not found. Please contact admin.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan the QR code or tap a button below to pay your monthly fee of{" "}
          <span className="font-semibold text-foreground">
            ₹{Number(member.monthlyFee).toLocaleString()}
          </span>
          .
        </p>
        <UpiPaymentPanel
          amount={Number(member.monthlyFee)}
          memberName={member.name}
        />
        {/* Confirm Payment button */}
        <div
          className="mt-2 p-4 rounded-xl border"
          style={{ background: "#f0fdf4", borderColor: "#86efac" }}
        >
          <p className="text-sm font-medium text-green-800 mb-3">
            ✅ After completing payment via UPI, tap below to confirm and
            automatically update your payment record:
          </p>
          <Button
            type="button"
            onClick={handleConfirmMonthlyPayment}
            disabled={payConfirmLoading}
            data-ocid="pay.confirm.primary_button"
            className="w-full text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #006633 0%, #00A859 100%)",
            }}
          >
            {payConfirmLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording Payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />I Have Completed This
                Payment
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderPrevBalContent() {
    if (membersLoading) {
      return (
        <div className="space-y-3" data-ocid="prevbal.loading_state">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      );
    }
    if (membersError || !member) {
      return (
        <div
          className="flex flex-col items-center gap-3 py-10 px-4 rounded-lg text-center"
          style={{ background: "#fff5f5" }}
          data-ocid="prevbal.error_state"
        >
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Could not load balance data. Please try again.
          </p>
        </div>
      );
    }

    if (memberPrevBal === 0) {
      return (
        <div
          className="flex flex-col items-center gap-3 py-10 px-4 rounded-lg text-center"
          style={{ background: "#f0fdf4" }}
          data-ocid="prevbal.empty_state"
        >
          <div className="text-4xl">✅</div>
          <p className="font-semibold text-green-700">No outstanding balance</p>
          <p className="text-sm text-green-600">
            You have no previous dues pending.
          </p>
        </div>
      );
    }

    const payAmount =
      prevBalPayAmount > 0 && prevBalPayAmount <= memberPrevBal
        ? prevBalPayAmount
        : memberPrevBal;

    return (
      <div className="space-y-4">
        {/* Outstanding balance highlight */}
        <div
          className="p-4 rounded-xl border-2 text-center"
          style={{ background: "#fffbeb", borderColor: "#D4AF37" }}
        >
          <p className="text-sm font-medium text-amber-700 mb-1">
            Outstanding Previous Balance
          </p>
          <p className="text-3xl font-bold" style={{ color: "#92400e" }}>
            ₹{memberPrevBal.toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            This is the balance carried forward from before the app was set up.
          </p>
        </div>

        {/* Payment options */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Choose payment amount:
          </p>

          <Button
            type="button"
            onClick={() => setPrevBalPayAmount(memberPrevBal)}
            data-ocid="prevbal.primary_button"
            className="w-full text-white font-semibold"
            style={{
              background:
                payAmount === memberPrevBal
                  ? "linear-gradient(135deg, #006633 0%, #00A859 100%)"
                  : undefined,
            }}
            variant={payAmount === memberPrevBal ? "default" : "outline"}
          >
            Pay in Full (₹{memberPrevBal.toLocaleString()})
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="partial-amount">Or pay a partial amount (₹)</Label>
            <Input
              id="partial-amount"
              data-ocid="prevbal.input"
              type="number"
              min={1}
              max={memberPrevBal}
              placeholder={`1 – ${memberPrevBal}`}
              value={
                prevBalPayAmount > 0 && prevBalPayAmount < memberPrevBal
                  ? prevBalPayAmount
                  : ""
              }
              onChange={(e) => {
                const val = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(val) && val > 0 && val <= memberPrevBal) {
                  setPrevBalPayAmount(val);
                } else if (e.target.value === "") {
                  setPrevBalPayAmount(0);
                }
              }}
            />
          </div>
        </div>

        {/* UPI Payment Panel */}
        <div className="mt-2">
          <UpiPaymentPanel amount={payAmount} memberName={member.name} />
        </div>

        {/* Confirm Payment button */}
        <div
          className="p-4 rounded-xl border"
          style={{ background: "#f0fdf4", borderColor: "#86efac" }}
        >
          <p className="text-sm font-medium text-green-800 mb-3">
            ✅ After completing payment, tap below to confirm and automatically
            deduct ₹{payAmount.toLocaleString()} from your balance:
          </p>
          <Button
            type="button"
            onClick={handleConfirmPrevBalPayment}
            disabled={prevBalConfirmLoading || payAmount <= 0}
            data-ocid="prevbal.confirm.primary_button"
            className="w-full text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
            }}
          >
            {prevBalConfirmLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording Payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />I Have Completed This
                Payment
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="app-header text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <img
              src="/assets/generated/tmc-logo-v2.dim_700x200.png"
              alt="Tengakhat Masjid Committee"
              className="h-14 w-auto object-contain"
            />
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium text-white/90">
                {member ? member.name : "Member"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white hover:text-white hover:bg-white/10"
                data-ocid="member.logout_button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div
        className="border-b sticky top-20 z-40"
        style={{
          background: "rgba(0,60,30,0.97)",
          borderColor: "rgba(212,175,55,0.3)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto py-1">
          {TAB_LIST.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-ocid={`member.${tab.id}.tab`}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.id === "prevbal" && memberPrevBal > 0 && (
                <Badge
                  className="ml-1.5 text-xs px-1.5 py-0"
                  style={{ background: "#D4AF37", color: "#000" }}
                >
                  !
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* PROFILE */}
          {activeTab === "profile" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">My Profile</CardTitle>
              </CardHeader>
              <CardContent data-ocid="profile.card">
                {renderProfileContent()}
              </CardContent>
            </Card>
          )}

          {/* PAYMENT HISTORY */}
          {activeTab === "history" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myPayments.length === 0 ? (
                  <div
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="history.empty_state"
                  >
                    <p className="text-3xl mb-2">💳</p>
                    <p>No payments recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-ocid="history.list">
                    {[...myPayments]
                      .sort(
                        (a, b) => Number(b.paymentDate) - Number(a.paymentDate),
                      )
                      .map((p, idx) => (
                        <div
                          key={String(p.paymentId)}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{ borderColor: "rgba(212,175,55,0.3)" }}
                          data-ocid={`history.item.${idx + 1}`}
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              {MONTHS[Number(p.month) - 1]} {String(p.year)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.paymentMode} •{" "}
                              {new Date(
                                Number(p.paymentDate) / 1_000_000,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className="font-bold"
                              style={{ color: "#004d26" }}
                            >
                              ₹{Number(p.amountPaid).toLocaleString()}
                            </p>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                p.status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : p.status === "Partial"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* MONTHLY STATUS */}
          {activeTab === "status" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Monthly Status — {currentYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {MONTHS.map((month, idx) => {
                    const monthNum = idx + 1;
                    const payment = myPayments.find(
                      (p) =>
                        Number(p.month) === monthNum &&
                        Number(p.year) === currentYear,
                    );
                    return (
                      <div
                        key={month}
                        className={`p-3 rounded-lg text-center text-sm font-medium border ${
                          payment?.status === "Paid"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : payment?.status === "Partial"
                              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                              : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <p className="font-bold">{month}</p>
                        <p className="text-xs mt-0.5">
                          {payment?.status ?? "Unpaid"}
                        </p>
                        {payment && (
                          <p className="text-xs font-bold mt-0.5">
                            ₹{Number(payment.amountPaid).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PAY NOW */}
          {activeTab === "pay" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Make a UPI Payment
                </CardTitle>
              </CardHeader>
              <CardContent data-ocid="pay.card">
                {renderPayContent()}
              </CardContent>
            </Card>
          )}

          {/* PREVIOUS BALANCE */}
          {activeTab === "prevbal" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Previous Balance
                </CardTitle>
              </CardHeader>
              <CardContent data-ocid="prevbal.card">
                {renderPrevBalContent()}
              </CardContent>
            </Card>
          )}

          {/* CHANGE PIN */}
          {activeTab === "pin" && (
            <Card
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">Change PIN</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePinChange} className="space-y-4 max-w-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pin">New PIN</Label>
                    <Input
                      id="new-pin"
                      type="password"
                      placeholder="Min 4 digits"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      maxLength={6}
                      required
                      data-ocid="pin.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pin">Confirm PIN</Label>
                    <Input
                      id="confirm-pin"
                      type="password"
                      placeholder="Confirm new PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      maxLength={6}
                      required
                      data-ocid="pin.confirm_input"
                    />
                  </div>
                  {pinError && (
                    <p
                      className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                      data-ocid="pin.error_state"
                    >
                      {pinError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="text-white font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, #006633 0%, #00A859 100%)",
                    }}
                    data-ocid="pin.submit_button"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Update PIN
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      <footer
        className="border-t py-4 text-center text-xs"
        style={{
          borderColor: "rgba(212,175,55,0.3)",
          background: "rgba(0,0,0,0.3)",
          color: "rgba(212,175,55,0.9)",
        }}
      >
        © {new Date().getFullYear()} Tengakhat Masjid Committee
      </footer>
    </div>
  );
}
