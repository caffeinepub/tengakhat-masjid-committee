import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    if (username.trim() === "admin" && password === "logmein") {
      toast.success("Welcome back, Admin!");
      onLogin();
    } else {
      setError("Invalid username or password. Please try again.");
      toast.error("Login failed");
    }
    setLoading(false);
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
        <Card
          className="shadow-2xl"
          style={{
            border: "2px solid rgba(212, 175, 55, 0.6)",
            background: "rgba(255, 255, 255, 0.97)",
          }}
        >
          <CardHeader className="text-center pb-2 pt-8">
            {/* Logo — larger with visible text */}
            <div className="flex justify-center mb-4">
              <img
                src="/assets/generated/tmc-logo-transparent.dim_700x220.png"
                alt="Tengakhat Masjid Committee"
                className="h-36 w-auto object-contain"
                style={{
                  filter:
                    "drop-shadow(0 2px 8px rgba(0,0,0,0.25)) brightness(0.95) saturate(1.2)",
                }}
              />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#004d26" }}>
              Admin Login
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-4">
            {/* Gold divider */}
            <div
              className="h-0.5 w-full mb-5 rounded"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              }}
            />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="font-semibold text-gray-700"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  data-ocid="login.input"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="font-semibold text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  data-ocid="login.password.input"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3"
                >
                  {error}
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
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
