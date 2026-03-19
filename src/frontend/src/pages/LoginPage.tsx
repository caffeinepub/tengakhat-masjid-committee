import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onAdminLogin: () => void;
  onMemberLogin: (memberId: string) => void;
}

type TabType = "admin" | "member";

export default function LoginPage({ onAdminLogin, onMemberLogin }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("admin");

  // Admin form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Member form
  const [memberId, setMemberId] = useState("");
  const [memberPin, setMemberPin] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    if (adminUser.trim() === "admin" && adminPass === "logmein") {
      toast.success("Welcome back, Admin!");
      onAdminLogin();
    } else {
      setAdminError("Invalid username or password.");
      toast.error("Login failed");
    }
    setAdminLoading(false);
  }

  async function handleMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMemberError("");
    setMemberLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const id = memberId.trim();
    if (!id) {
      setMemberError("Please enter your Member ID.");
      setMemberLoading(false);
      return;
    }

    // PIN lookup from localStorage (default 1234 if not set)
    const pins: Record<string, string> = JSON.parse(
      localStorage.getItem("tmc_member_pins") ?? "{}",
    );
    const expectedPin = pins[id] ?? "1234";

    if (memberPin === expectedPin) {
      toast.success("Welcome!");
      onMemberLogin(id);
    } else {
      setMemberError("Invalid Member ID or PIN.");
      toast.error("Login failed");
    }
    setMemberLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #1a2f6e 60%, #7a5c00 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo on dark background — fully visible */}
        <div className="flex justify-center mb-6">
          <img
            src="/assets/generated/tmc-logo-v2.dim_700x200.png"
            alt="Tengakhat Masjid Committee"
            className="h-28 w-auto object-contain rounded-xl"
            style={{
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        <Card
          className="shadow-2xl"
          style={{
            border: "2px solid rgba(212, 175, 55, 0.6)",
            background: "rgba(255, 255, 255, 0.97)",
          }}
        >
          <CardHeader className="pb-2 pt-6">
            {/* Tabs */}
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: "rgba(212,175,55,0.4)" }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "admin"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                style={{
                  background:
                    activeTab === "admin"
                      ? "linear-gradient(135deg, #006633 0%, #00A859 100%)"
                      : "transparent",
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("member")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "member"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                style={{
                  background:
                    activeTab === "member"
                      ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                      : "transparent",
                }}
              >
                <User className="w-3.5 h-3.5" />
                Member
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-3">
            <div
              className="h-0.5 w-full mb-5 rounded"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              }}
            />

            {activeTab === "admin" ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="a-user"
                    className="font-semibold text-gray-700"
                  >
                    Username
                  </Label>
                  <Input
                    id="a-user"
                    data-ocid="login.input"
                    type="text"
                    placeholder="Enter username"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="a-pass"
                    className="font-semibold text-gray-700"
                  >
                    Password
                  </Label>
                  <Input
                    id="a-pass"
                    data-ocid="login.password.input"
                    type="password"
                    placeholder="Enter password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {adminError && (
                  <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">
                    {adminError}
                  </p>
                )}
                <Button
                  type="submit"
                  data-ocid="login.submit_button"
                  className="w-full text-white font-semibold h-11"
                  style={{
                    background:
                      "linear-gradient(135deg, #006633 0%, #00A859 100%)",
                  }}
                  disabled={adminLoading}
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Admin Sign In
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-id" className="font-semibold text-gray-700">
                    Member ID
                  </Label>
                  <Input
                    id="m-id"
                    data-ocid="member.login.id.input"
                    type="text"
                    placeholder="Enter your Member ID"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="m-pin"
                    className="font-semibold text-gray-700"
                  >
                    PIN
                  </Label>
                  <Input
                    id="m-pin"
                    data-ocid="member.login.pin.input"
                    type="password"
                    placeholder="Enter your 4-digit PIN"
                    value={memberPin}
                    onChange={(e) => setMemberPin(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Default PIN is <strong>1234</strong>. You can change it after
                  login.
                </p>
                {memberError && (
                  <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">
                    {memberError}
                  </p>
                )}
                <Button
                  type="submit"
                  data-ocid="member.login.submit_button"
                  className="w-full text-white font-semibold h-11"
                  style={{
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  }}
                  disabled={memberLoading}
                >
                  {memberLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Member Sign In
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p
          className="text-center text-xs mt-6 font-medium"
          style={{ color: "rgba(255, 220, 100, 0.95)" }}
        >
          © {new Date().getFullYear()} Tengakhat Masjid Committee
        </p>
      </motion.div>
    </div>
  );
}
