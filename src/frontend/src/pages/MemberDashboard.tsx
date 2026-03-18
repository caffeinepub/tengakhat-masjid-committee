import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  LogOut,
  Moon,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { Member } from "../hooks/useQueries";
import { useUpiSettings } from "../hooks/useQueries";

interface Props {
  member: Member;
  onLogout: () => void;
}

export default function MemberDashboard({ member, onLogout }: Props) {
  const { identity } = useInternetIdentity();
  const { data: upiSettings } = useUpiSettings();
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const copyPrincipal = () => {
    navigator.clipboard.writeText(myPrincipal);
    setCopiedPrincipal(true);
    toast.success("Principal ID copied!");
    setTimeout(() => setCopiedPrincipal(false), 2000);
  };

  const upiId = upiSettings?.upiId ?? "";
  const amount = Number(member.monthlyContribution);
  const name = encodeURIComponent("Tengakhat Masjid Committee");
  const note = encodeURIComponent(`Monthly contribution - ${member.name}`);

  const gpayUrl = upiId
    ? `intent://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
    : "#";
  const phonepeUrl = upiId
    ? `intent://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR#Intent;scheme=upi;package=com.phonepe.app;end`
    : "#";
  const paytmUrl = upiId
    ? `intent://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR#Intent;scheme=upi;package=net.one97.paytm;end`
    : "#";
  const genericUpiUrl = upiId
    ? `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR`
    : "#";

  const handlePayment = (appName: string, url: string) => {
    if (!upiId) {
      toast.error("UPI ID not configured. Contact your admin.");
      return;
    }
    toast.success(`Opening ${appName}...`);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col navy-gradient font-poppins">
      {/* Header */}
      <header className="border-b border-gold/20 px-4 py-3 sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gold bg-islamic/20 flex items-center justify-center">
              <Moon size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-gold font-bold text-sm leading-none">
                TENGAKHAT MASJID
              </p>
              <p className="text-white/40 text-xs mt-0.5">Member Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary-foreground border-primary/30 text-xs hidden sm:flex">
              Member
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
              data-ocid="nav.logout_button"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card-navy rounded-2xl p-6"
          data-ocid="member.profile.card"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/30 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <User size={26} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{member.name}</h2>
              <p className="text-white/50 text-sm">@{member.username}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                  Serial #{member.serialNumber.toString()}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                Phone
              </p>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gold/60" />
                <p className="text-white/80 text-sm">{member.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                Monthly
              </p>
              <div className="flex items-center gap-2">
                <Wallet size={13} className="text-gold/60" />
                <p className="text-white font-semibold">
                  ₹{member.monthlyContribution.toString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                Balance
              </p>
              <p
                className={`text-sm font-semibold ${
                  Number(member.balance) >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                ₹{member.balance.toString()}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                Username
              </p>
              <p className="text-white/70 text-sm">@{member.username}</p>
            </div>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
              Your Principal ID
            </p>
            <div className="flex items-center gap-2">
              <p className="text-white/50 text-xs font-mono flex-1 min-w-0 truncate">
                {myPrincipal}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-gold/60 hover:text-gold flex-shrink-0 h-7 px-2"
                onClick={copyPrincipal}
                data-ocid="member.profile.copy_button"
              >
                {copiedPrincipal ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Copy size={13} />
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Payment Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card-navy rounded-2xl p-6 space-y-4"
          data-ocid="member.payment.card"
        >
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard size={18} className="text-gold" />
              Pay Contribution
            </h3>
            <p className="text-white/50 text-sm">
              Monthly: ₹{member.monthlyContribution.toString()}
            </p>
          </div>

          {!upiId ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-white/50 text-sm">
                UPI payment not configured. Please contact your admin.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-primary/20 border border-primary/30 p-3">
                <p className="text-white/60 text-xs">
                  Paying to:{" "}
                  <span className="text-gold font-medium">{upiId}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* GPay */}
                <button
                  type="button"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all group"
                  onClick={() => handlePayment("Google Pay", gpayUrl)}
                  data-ocid="member.payment.gpay_button"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="none"
                      role="img"
                      aria-label="Google Pay"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium group-hover:text-gold transition-colors">
                      Google Pay
                    </p>
                    <p className="text-white/40 text-xs">Pay via GPay</p>
                  </div>
                  <div className="ml-auto text-gold/60 group-hover:text-gold">
                    ₹{amount}
                  </div>
                </button>

                {/* PhonePe */}
                <button
                  type="button"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all group"
                  onClick={() => handlePayment("PhonePe", phonepeUrl)}
                  data-ocid="member.payment.phonepe_button"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5f259f] flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="white"
                      role="img"
                      aria-label="PhonePe"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V9h2v8zm4-8h-2v5.5c0 .83-.67 1.5-1.5 1.5S10 15.33 10 14.5V11H8V8.5C8 7.12 9.12 6 10.5 6H13c.55 0 1 .45 1 1v2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium group-hover:text-gold transition-colors">
                      PhonePe
                    </p>
                    <p className="text-white/40 text-xs">Pay via PhonePe</p>
                  </div>
                  <div className="ml-auto text-gold/60 group-hover:text-gold">
                    ₹{amount}
                  </div>
                </button>

                {/* Paytm */}
                <button
                  type="button"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all group"
                  onClick={() => handlePayment("Paytm", paytmUrl)}
                  data-ocid="member.payment.paytm_button"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#002970] flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="none"
                      role="img"
                      aria-label="Paytm"
                    >
                      <rect width="24" height="24" rx="4" fill="#002970" />
                      <text
                        x="3"
                        y="16"
                        fontSize="10"
                        fill="#00baf2"
                        fontWeight="bold"
                      >
                        Pay
                      </text>
                      <text x="3" y="22" fontSize="6" fill="white">
                        tm
                      </text>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium group-hover:text-gold transition-colors">
                      Paytm
                    </p>
                    <p className="text-white/40 text-xs">Pay via Paytm</p>
                  </div>
                  <div className="ml-auto text-gold/60 group-hover:text-gold">
                    ₹{amount}
                  </div>
                </button>

                {/* Generic UPI */}
                <button
                  type="button"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gold/10 border border-gold/30 hover:border-gold/60 hover:bg-gold/20 transition-all group"
                  onClick={() => handlePayment("UPI", genericUpiUrl)}
                  data-ocid="member.payment.upi_button"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Wallet size={20} className="text-gold" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium group-hover:text-gold transition-colors">
                      Any UPI App
                    </p>
                    <p className="text-white/40 text-xs">
                      Open with default UPI app
                    </p>
                  </div>
                  <div className="ml-auto text-gold font-semibold">
                    ₹{amount}
                  </div>
                </button>
              </div>

              <p className="text-white/30 text-xs text-center">
                Payments are processed directly via your UPI app. Contact admin
                after payment.
              </p>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-3 px-4">
        <p className="text-white/30 text-xs text-center">
          © {new Date().getFullYear()} Tengakhat Masjid Committee · Built with ❤️
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-gold/50 hover:text-gold transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
