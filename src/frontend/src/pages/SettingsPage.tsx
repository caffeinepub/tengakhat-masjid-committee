import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Save, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function getAdminCredentials(): { username: string; password: string } {
  try {
    const stored = localStorage.getItem("tmc_admin_credentials");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { username: "admin", password: "logmein" };
}

export default function SettingsPage() {
  const [upiId, setUpiId] = useState(
    () => localStorage.getItem("tmc_upi_id") ?? "",
  );

  // Admin credentials change form
  const currentCreds = getAdminCredentials();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credError, setCredError] = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = upiId.trim();
    if (!trimmed) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    localStorage.setItem("tmc_upi_id", trimmed);
    toast.success("UPI ID saved successfully");
  }

  function handleCredentialsChange(e: React.FormEvent) {
    e.preventDefault();
    setCredError("");

    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setCredError("Username must be at least 3 characters.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setCredError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredError("Passwords do not match.");
      return;
    }

    localStorage.setItem(
      "tmc_admin_credentials",
      JSON.stringify({ username: newUsername.trim(), password: newPassword }),
    );
    toast.success(
      "Admin credentials updated. Use your new credentials next time you log in.",
    );
    setNewUsername("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure app preferences
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-6">
        {/* UPI Settings */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            UPI Payment
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set the committee's UPI ID so members can pay via GPay, PhonePe, or
            Paytm. The ID will be used to generate payment links and QR codes.
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="upi-id">Committee UPI ID</Label>
              <Input
                id="upi-id"
                data-ocid="settings.upi_id.input"
                placeholder="e.g. tengakhat@upi or 9876543210@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: username@bankhandle (e.g. committee@ybl,
                9999999999@paytm)
              </p>
            </div>
            <Button
              type="submit"
              data-ocid="settings.save.button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              Save UPI ID
            </Button>
          </form>
        </div>

        {/* Current Admin Credentials Display */}
        <div className="border-t border-border pt-5">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Admin Credentials
          </h3>
          <p className="text-sm text-muted-foreground">
            Current username:{" "}
            <span className="font-mono font-medium text-foreground">
              {currentCreds.username}
            </span>
          </p>
        </div>

        {/* Change Admin Credentials */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Change Admin Login Credentials
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Update your admin username and password. You will need to use the
            new credentials next time you log in.
          </p>
          <form onSubmit={handleCredentialsChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                data-ocid="settings.new_username.input"
                type="text"
                placeholder="Min 3 characters"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="new-username"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                data-ocid="settings.new_password.input"
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                data-ocid="settings.confirm_password.input"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {credError && (
              <p
                data-ocid="settings.credentials.error_state"
                className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
              >
                {credError}
              </p>
            )}
            <Button
              type="submit"
              data-ocid="settings.credentials.save_button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Update Credentials
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
