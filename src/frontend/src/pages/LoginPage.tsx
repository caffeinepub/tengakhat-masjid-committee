import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useMembers } from "../hooks/useQueries";

interface Props {
  onAdminLogin: () => void;
  onMemberLogin: (memberId: string) => void;
}

type TabType = "admin" | "member";

function getAdminCredentials(): { username: string; password: string } {
  try {
    const stored = localStorage.getItem("tmc_admin_credentials");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { username: "admin", password: "logmein" };
}

export default function LoginPage({ onAdminLogin, onMemberLogin }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("admin");

  // Admin form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Member form
  const [loginId, setLoginId] = useState("");
  const [memberPin, setMemberPin] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");

  // Fetch members list so we can validate the Login ID on login
  const {
    data: allMembers,
    isLoading: membersLoading,
    isError: membersError,
  } = useMembers();

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const creds = getAdminCredentials();
    if (adminUser.trim() === creds.username && adminPass === creds.password) {
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

    const id = loginId.trim().toLowerCase();
    if (!id) {
      setMemberError("Please enter your Login ID.");
      setMemberLoading(false);
      return;
    }

    // If members list failed to load, we can't verify
    if (membersError) {
      setMemberError("Could not verify Login ID. Please try again.");
      setMemberLoading(false);
      return;
    }

    // If members list is still loading, wait briefly then re-check
    if (membersLoading || !allMembers) {
      setMemberError("Verifying... Please try again in a moment.");
      setMemberLoading(false);
      return;
    }

    // Resolve loginId -> memberId via tmc_member_login_ids
    const loginIds: Record<string, string> = JSON.parse(
      localStorage.getItem("tmc_member_login_ids") ?? "{}",
    );
    let resolvedMemberId = loginIds[id];

    // Fallback: try treating the input as a raw memberId (for backward compatibility)
    if (!resolvedMemberId) {
      const directMatch = allMembers.find(
        (m) => String(m.memberId) === loginId.trim(),
      );
      if (directMatch) {
        resolvedMemberId = String(directMatch.memberId);
      }
    }

    if (!resolvedMemberId) {
      setMemberError("Login ID not found. Please contact your admin.");
      toast.error("Login failed");
      setMemberLoading(false);
      return;
    }

    // Verify the resolved memberId exists in backend
    const matchedMember = allMembers.find(
      (m) => String(m.memberId) === resolvedMemberId,
    );
    if (!matchedMember) {
      setMemberError("Member not found. Please contact your admin.");
      toast.error("Login failed");
      setMemberLoading(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 400));

    // PIN lookup from localStorage (default 1234 if not set)
    const pins: Record<string, string> = JSON.parse(
      localStorage.getItem("tmc_member_pins") ?? "{}",
    );
    const expectedPin = pins[resolvedMemberId] ?? "1234";

    if (memberPin === expectedPin) {
      toast.success("Welcome!");
      onMemberLogin(resolvedMemberId);
    } else {
      setMemberError("Invalid Login ID or PIN.");
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
                    Login ID
                  </Label>
                  <Input
                    id="m-id"
                    data-ocid="member.login.id.input"
                    type="text"
                    placeholder="Enter your login ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
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
                  Your login ID is your <strong>first name</strong> or{" "}
                  <strong>3-digit number</strong> assigned by admin. Default PIN
                  is <strong>1234</strong>.
                </p>
                {memberError && (
                  <p
                    data-ocid="member.login.error_state"
                    className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3"
                  >
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
                      Verifying...
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
