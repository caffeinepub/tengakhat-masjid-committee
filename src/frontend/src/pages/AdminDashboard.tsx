import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import {
  Copy,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddMember,
  useDeleteMember,
  useMembers,
  useUpdateUpiSettings,
  useUpiSettings,
} from "../hooks/useQueries";

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  const { identity } = useInternetIdentity();
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: upiSettings } = useUpiSettings();
  const addMember = useAddMember();
  const deleteMember = useDeleteMember();
  const updateUpi = useUpdateUpiSettings();

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Principal | null>(null);
  const [upiInput, setUpiInput] = useState(upiSettings?.upiId ?? "");

  const [form, setForm] = useState({
    principalId: "",
    username: "",
    pin: "",
    name: "",
    phone: "",
    serialNumber: "",
    monthlyContribution: "",
  });

  const handleAddMember = async () => {
    const requiredFields = [
      form.principalId,
      form.username,
      form.pin,
      form.name,
      form.phone,
      form.serialNumber,
      form.monthlyContribution,
    ];
    if (requiredFields.some((f) => !f.trim())) {
      toast.error("Please fill all required fields");
      return;
    }
    let principal: Principal;
    try {
      principal = Principal.fromText(form.principalId);
    } catch {
      toast.error("Invalid Principal ID format");
      return;
    }
    try {
      await addMember.mutateAsync({
        principal,
        username: form.username,
        pin: form.pin,
        name: form.name,
        phone: form.phone,
        monthlyContribution: BigInt(form.monthlyContribution),
      });
      toast.success(`${form.name} added successfully!`);
      setShowAddModal(false);
      setForm({
        principalId: "",
        username: "",
        pin: "",
        name: "",
        phone: "",
        serialNumber: "",
        monthlyContribution: "",
      });
    } catch {
      toast.error("Failed to add member. Check the Principal ID.");
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMember.mutateAsync(deleteTarget);
      toast.success("Member removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleSaveUpi = async () => {
    if (!upiInput.trim()) {
      toast.error("Please enter a UPI ID");
      return;
    }
    try {
      await updateUpi.mutateAsync(upiInput.trim());
      toast.success("UPI ID saved!");
    } catch {
      toast.error("Failed to save UPI ID");
    }
  };

  const myPrincipal = identity?.getPrincipal().toString();

  return (
    <div className="min-h-screen flex flex-col navy-gradient font-poppins">
      {/* Header */}
      <header className="border-b border-gold/20 px-4 py-3 sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gold bg-islamic/20 flex items-center justify-center">
              <Moon size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-gold font-bold text-sm leading-none">
                TENGAKHAT MASJID COMMITTEE
              </p>
              <p className="text-white/40 text-xs mt-0.5">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gold/20 text-gold border-gold/30 text-xs hidden sm:flex">
              Admin
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="mb-6 bg-white/10" data-ocid="admin.tab">
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              data-ocid="admin.members_tab"
            >
              <Users size={15} />
              Members
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              data-ocid="admin.settings_tab"
            >
              <Settings size={15} />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Members</h2>
                  <p className="text-white/50 text-sm">
                    {members.length} registered member
                    {members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  className="btn-gold"
                  onClick={() => setShowAddModal(true)}
                  data-ocid="admin.members.open_modal_button"
                >
                  <Plus size={16} className="mr-1" />
                  Add Member
                </Button>
              </div>

              {/* Principal ID info box */}
              {myPrincipal && (
                <div className="glass-card rounded-xl p-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Copy size={13} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-medium">
                      Your Principal ID (share with members so they can
                      self-register):
                    </p>
                    <p className="text-gold/80 text-xs font-mono mt-0.5 truncate">
                      {myPrincipal}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      When adding a member, paste their Principal ID — they can
                      find it by clicking &quot;Connect &amp; Login as
                      Member&quot; on the login page.
                    </p>
                  </div>
                </div>
              )}

              {/* Members Table */}
              {membersLoading ? (
                <div
                  className="space-y-2"
                  data-ocid="admin.members.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full bg-white/10" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div
                  className="glass-card-navy rounded-2xl p-12 text-center"
                  data-ocid="admin.members.empty_state"
                >
                  <Users size={40} className="text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No members yet.</p>
                  <p className="text-white/30 text-sm">
                    Click &quot;Add Member&quot; to get started.
                  </p>
                </div>
              ) : (
                <div className="glass-card-navy rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-gold/80">#</TableHead>
                        <TableHead className="text-gold/80">Name</TableHead>
                        <TableHead className="text-gold/80 hidden sm:table-cell">
                          Username
                        </TableHead>
                        <TableHead className="text-gold/80 hidden md:table-cell">
                          Phone
                        </TableHead>
                        <TableHead className="text-gold/80 hidden md:table-cell">
                          Monthly (₹)
                        </TableHead>
                        <TableHead className="text-gold/80 hidden lg:table-cell">
                          Balance (₹)
                        </TableHead>
                        <TableHead className="text-right text-gold/80">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(([principal, member], idx) => (
                        <TableRow
                          key={principal.toString()}
                          className="border-white/10 hover:bg-white/5"
                          data-ocid={`admin.members.item.${idx + 1}`}
                        >
                          <TableCell className="text-white/70 font-mono text-sm">
                            {member.serialNumber.toString()}
                          </TableCell>
                          <TableCell>
                            <p className="text-white font-medium">
                              {member.name}
                            </p>
                            <p className="text-white/40 text-xs sm:hidden">
                              @{member.username}
                            </p>
                          </TableCell>
                          <TableCell className="text-white/60 hidden sm:table-cell">
                            @{member.username}
                          </TableCell>
                          <TableCell className="text-white/60 hidden md:table-cell">
                            {member.phone}
                          </TableCell>
                          <TableCell className="text-white/60 hidden md:table-cell">
                            ₹{member.monthlyContribution.toString()}
                          </TableCell>
                          <TableCell className="text-white/60 hidden lg:table-cell">
                            ₹{member.balance.toString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(principal)}
                              data-ocid={`admin.members.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-white/50 text-sm">
                  Configure UPI payment details
                </p>
              </div>

              <div className="glass-card-navy rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Committee UPI ID</Label>
                  <Input
                    placeholder="e.g. committee@upi"
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold"
                    data-ocid="admin.settings.input"
                  />
                  <p className="text-white/40 text-xs">
                    This UPI ID will be used for member payment links (GPay,
                    PhonePe, Paytm).
                  </p>
                  {upiSettings?.upiId && (
                    <p className="text-green-400 text-xs">
                      Current: {upiSettings.upiId}
                    </p>
                  )}
                </div>

                <Button
                  className="btn-gold w-full"
                  onClick={handleSaveUpi}
                  disabled={updateUpi.isPending}
                  data-ocid="admin.settings.save_button"
                >
                  {updateUpi.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : null}
                  Save UPI ID
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent
          className="bg-card border-white/20 text-white max-w-md max-h-[90vh] overflow-y-auto"
          data-ocid="admin.members.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-gold/10 border border-gold/20 p-3 text-xs text-white/60">
              <p className="font-medium text-gold/80 mb-1">
                How to get Principal ID:
              </p>
              <p>
                Ask the member to open the app, go to Member Login tab, click
                &quot;Connect &amp; Login as Member&quot;, then copy their
                Principal ID from their profile page.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Principal ID *</Label>
              <Input
                placeholder="Member's Internet Identity Principal"
                value={form.principalId}
                onChange={(e) =>
                  setForm({ ...form, principalId: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-xs"
                data-ocid="admin.members.input"
              />
            </div>
            {(
              [
                ["name", "Full Name *", "e.g. Ahmed Khan"],
                ["username", "Username *", "e.g. ahmed.khan"],
                ["pin", "PIN *", "4–6 digit PIN for member login"],
                ["phone", "Phone Number *", "e.g. 9876543210"],
                ["serialNumber", "Serial Number *", "e.g. 1"],
                [
                  "monthlyContribution",
                  "Monthly Contribution (₹) *",
                  "e.g. 500",
                ],
              ] as [keyof typeof form, string, string][]
            ).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-2">
                <Label className="text-white/80">{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  type={
                    key === "monthlyContribution" || key === "serialNumber"
                      ? "number"
                      : "text"
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="text-white/60"
              data-ocid="admin.members.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleAddMember}
              disabled={addMember.isPending}
              data-ocid="admin.members.submit_button"
            >
              {addMember.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className="bg-card border-white/20 text-white max-w-sm"
          data-ocid="admin.members.delete_dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Remove Member?</DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm">
            This will permanently remove the member and all their data. This
            action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="text-white/60"
              data-ocid="admin.members.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={deleteMember.isPending}
              data-ocid="admin.members.delete_button"
            >
              {deleteMember.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
