import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [upiId, setUpiId] = useState(
    () => localStorage.getItem("tmc_upi_id") ?? "",
  );

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

        <div className="border-t border-border pt-5">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Admin Credentials
          </h3>
          <p className="text-sm text-muted-foreground">
            Username:{" "}
            <span className="font-mono font-medium text-foreground">admin</span>
            {" · "}
            Password is managed by the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
