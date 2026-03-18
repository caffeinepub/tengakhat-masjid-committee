import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, Lock, Moon, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const DEFAULT_CREDENTIALS = { username: "admin", password: "logmein" };

function getStoredCredentials(): { username: string; password: string } {
  try {
    const raw = localStorage.getItem("adminCredentials");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_CREDENTIALS;
}

interface Props {
  onAdminLogin: () => void;
  onMemberLogin: (username: string, pin: string) => void;
  isMemberLoading: boolean;
  memberError: string | null;
}

export default function LoginPage({
  onAdminLogin,
  onMemberLogin,
  isMemberLoading,
  memberError,
}: Props) {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [memberUsername, setMemberUsername] = useState("");
  const [memberPin, setMemberPin] = useState("");

  const handleAdminLogin = () => {
    const creds = getStoredCredentials();
    if (
      adminUsername.trim() !== creds.username ||
      adminPassword !== creds.password
    ) {
      setAdminError("Incorrect username or password");
      return;
    }
    setAdminError(null);
    onAdminLogin();
  };

  const handleMemberLogin = () => {
    if (!memberUsername.trim() || !memberPin.trim()) return;
    onMemberLogin(memberUsername.trim(), memberPin.trim());
  };

  return (
    <div className="min-h-screen flex flex-col navy-gradient font-poppins">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
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

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Username</Label>
                    <div className="relative">
                      <User
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <Input
                        type="text"
                        placeholder="Enter username"
                        value={adminUsername}
                        onChange={(e) => {
                          setAdminUsername(e.target.value);
                          setAdminError(null);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAdminLogin()
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold pl-9"
                        data-ocid="login.admin.input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Password</Label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminError(null);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAdminLogin()
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold pl-9 pr-10"
                        data-ocid="login.admin.password_input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                  {adminError && (
                    <p className="text-red-400 text-xs">{adminError}</p>
                  )}
                </div>
                <Button
                  className="w-full btn-gold py-3 text-base font-semibold"
                  onClick={handleAdminLogin}
                  disabled={!adminUsername || !adminPassword}
                  data-ocid="login.admin.primary_button"
                >
                  <Shield size={16} className="mr-2" />
                  Login as Admin
                </Button>
              </TabsContent>

              <TabsContent value="member" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Username</Label>
                    <div className="relative">
                      <User
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <Input
                        type="text"
                        placeholder="Enter your username"
                        value={memberUsername}
                        onChange={(e) => setMemberUsername(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleMemberLogin()
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold pl-9"
                        data-ocid="login.member.username_input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">PIN</Label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <Input
                        type="password"
                        placeholder="Enter your PIN"
                        value={memberPin}
                        onChange={(e) => setMemberPin(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleMemberLogin()
                        }
                        maxLength={6}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold pl-9 text-center tracking-widest"
                        data-ocid="login.member.pin_input"
                      />
                    </div>
                  </div>
                  {memberError && (
                    <p className="text-red-400 text-xs">{memberError}</p>
                  )}
                </div>
                <Button
                  className="w-full green-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90"
                  onClick={handleMemberLogin}
                  disabled={!memberUsername || !memberPin || isMemberLoading}
                  data-ocid="login.member.primary_button"
                >
                  {isMemberLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <User size={16} className="mr-2" />
                      Login as Member
                    </>
                  )}
                </Button>
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
