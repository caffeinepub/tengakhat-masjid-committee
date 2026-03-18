import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Moon, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { Member } from "../hooks/useQueries";

interface Props {
  onAdminLogin: () => void;
  onMemberLogin: () => void;
  isVerifying: boolean;
  memberData: Member | null;
  pendingRole: "admin" | "member" | null;
  onCancelVerify: () => void;
}

export default function LoginPage({
  onAdminLogin,
  onMemberLogin,
  isVerifying,
  memberData,
  pendingRole,
  onCancelVerify,
}: Props) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const [memberPin, setMemberPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);

  const handleAdminLogin = async () => {
    try {
      await login();
      onAdminLogin();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleMemberConnect = async () => {
    try {
      await login();
      onMemberLogin();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleVerifyPin = () => {
    if (!memberData) return;
    if (memberPin === memberData.pin) {
      setPinVerified(true);
      toast.success("PIN verified! Entering dashboard...");
    } else {
      toast.error("Incorrect PIN. Please try again.");
    }
  };

  const isLoadingAdmin =
    (isLoggingIn || isVerifying) && pendingRole === "admin";
  const isLoadingMember =
    (isLoggingIn || isVerifying) && pendingRole === "member";

  return (
    <div className="min-h-screen flex flex-col navy-gradient font-poppins">
      {/* Header */}
      <header className="border-b border-gold/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gold overflow-hidden flex items-center justify-center bg-islamic/30">
            <Moon size={18} className="text-gold" />
          </div>
          <div>
            <p className="text-gold font-bold text-sm leading-tight">
              TENGAKHAT MASJID COMMITTEE
            </p>
            <p className="text-white/50 text-xs">
              Member Contribution Management
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Branding */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden md:flex flex-col gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="gold-divider flex-1" />
                <Moon size={16} className="text-gold" />
                <div className="gold-divider flex-1" />
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                TENGAKHAT
                <span className="block text-gold">MASJID</span>
                <span className="block text-white/90 text-3xl">COMMITTEE</span>
              </h1>
              <div className="gold-divider my-4 max-w-32" />
              <p className="text-white/70 leading-relaxed">
                Manage mosque contributions, member profiles, and UPI payments —
                all in one secure platform.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: Shield,
                  text: "Secured on Internet Computer blockchain",
                },
                { icon: User, text: "Role-based admin and member access" },
                { icon: Lock, text: "PIN-protected member accounts" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <item.icon size={15} className="text-gold" />
                  </div>
                  <p className="text-white/60 text-sm">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-xl p-4">
              <p className="text-white/40 text-xs text-center">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
              <p className="text-white/50 text-xs text-center mt-1">
                In the name of Allah, the Most Gracious, the Most Merciful
              </p>
            </div>
          </motion.div>

          {/* Right: Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-card-navy rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-1">Welcome</h2>
            <p className="text-white/50 text-sm mb-6">
              Choose your login type to continue
            </p>

            <Tabs defaultValue="admin" className="w-full">
              <TabsList
                className="w-full mb-6 bg-white/10"
                data-ocid="login.tab"
              >
                <TabsTrigger
                  value="admin"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white"
                  data-ocid="login.admin_tab"
                >
                  Admin
                </TabsTrigger>
                <TabsTrigger
                  value="member"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white"
                  data-ocid="login.member_tab"
                >
                  Member
                </TabsTrigger>
              </TabsList>

              {/* Admin Login */}
              <TabsContent value="admin" className="space-y-4">
                <div className="rounded-xl bg-white/5 border border-gold/20 p-4 text-sm text-white/60">
                  <p className="flex items-center gap-2">
                    <Shield size={14} className="text-gold flex-shrink-0" />
                    Click below to securely connect with Internet Identity.
                    Admin privileges are verified automatically.
                  </p>
                </div>

                <Button
                  className="w-full btn-gold py-3 text-base font-semibold"
                  onClick={handleAdminLogin}
                  disabled={isLoggingIn || isLoadingAdmin}
                  data-ocid="login.admin.primary_button"
                >
                  {isLoadingAdmin ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Verifying Admin...
                    </>
                  ) : (
                    <>
                      <Shield size={16} className="mr-2" />
                      Login as Admin
                    </>
                  )}
                </Button>

                {isLoadingAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full text-white/50 hover:text-white text-sm"
                    onClick={onCancelVerify}
                    data-ocid="login.cancel_button"
                  >
                    Cancel
                  </Button>
                )}
              </TabsContent>

              {/* Member Login */}
              <TabsContent value="member" className="space-y-4">
                {!identity ? (
                  <>
                    <div className="rounded-xl bg-white/5 border border-gold/20 p-4 text-sm text-white/60">
                      <p className="flex items-center gap-2">
                        <User size={14} className="text-gold flex-shrink-0" />
                        Connect with Internet Identity, then enter your PIN to
                        access your member account.
                      </p>
                    </div>

                    <Button
                      className="w-full green-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90"
                      onClick={handleMemberConnect}
                      disabled={isLoggingIn || isLoadingMember}
                      data-ocid="login.member.primary_button"
                    >
                      {isLoadingMember ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <User size={16} className="mr-2" />
                          Connect & Login as Member
                        </>
                      )}
                    </Button>
                  </>
                ) : memberData === null && pendingRole === "member" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-destructive/20 border border-destructive/40 p-4 text-sm text-white/80">
                      <p className="font-semibold mb-1">Account Not Found</p>
                      <p className="text-white/60 text-xs">
                        Your Internet Identity is not linked to any member
                        account. Please share your Principal ID with your admin
                        to register.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-white/50 hover:text-white text-sm"
                      onClick={onCancelVerify}
                      data-ocid="login.cancel_button"
                    >
                      Go Back
                    </Button>
                  </div>
                ) : memberData ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-primary/20 border border-primary/40 p-3 text-sm">
                      <p className="text-white/80">
                        Welcome,{" "}
                        <span className="text-gold font-semibold">
                          {memberData.name}
                        </span>
                      </p>
                      <p className="text-white/50 text-xs mt-0.5">
                        Serial #{memberData.serialNumber.toString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80 text-sm">Enter PIN</Label>
                      <Input
                        type="password"
                        placeholder="Your PIN"
                        value={memberPin}
                        onChange={(e) => setMemberPin(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleVerifyPin()
                        }
                        maxLength={6}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold text-center text-xl tracking-widest"
                        data-ocid="login.member.input"
                      />
                    </div>

                    <Button
                      className="w-full btn-gold py-3 text-base font-semibold"
                      onClick={handleVerifyPin}
                      disabled={pinVerified || !memberPin}
                      data-ocid="login.member.submit_button"
                    >
                      {pinVerified ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Entering Dashboard...
                        </>
                      ) : (
                        <>
                          <Lock size={16} className="mr-2" />
                          Verify PIN
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-white/50 hover:text-white text-sm"
                      onClick={onCancelVerify}
                      data-ocid="login.cancel_button"
                    >
                      Use different account
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center py-6">
                    <Loader2 size={28} className="text-gold animate-spin" />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-white/30 text-xs text-center">
                Powered by Internet Computer · Secured by blockchain
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-4 px-4">
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
