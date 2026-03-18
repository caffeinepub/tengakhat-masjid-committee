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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  History,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddAdmin,
  useAddMember,
  useAddPayment,
  useAdmins,
  useCallerProfile,
  useDeleteMember,
  useMembers,
  usePaymentsByMember,
  useUpdateUpiSettings,
  useUpiSettings,
} from "../hooks/useQueries";
import type { Member } from "../hooks/useQueries";

const MONTHS = [
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

function getStoredCredentials(): { username: string; password: string } {
  try {
    const raw = localStorage.getItem("adminCredentials");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { username: "admin", password: "logmein" };
}

function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChange = () => {
    const creds = getStoredCredentials();
    if (currentPw !== creds.password) {
      toast.error("Current password is incorrect");
      return;
    }
    if (newPw.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    const updated = { ...creds, password: newPw };
    localStorage.setItem("adminCredentials", JSON.stringify(updated));
    toast.success("Password changed successfully!");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="bg-card border-white/20 text-white max-w-sm"
        data-ocid="admin.change_password.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <KeyRound size={18} className="text-gold" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">Current Password</Label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-ocid="admin.change_password.current_input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">New Password</Label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-ocid="admin.change_password.new_input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChange()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-ocid="admin.change_password.confirm_input"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60"
            data-ocid="admin.change_password.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="btn-gold"
            onClick={handleChange}
            disabled={!currentPw || !newPw || !confirmPw}
            data-ocid="admin.change_password.submit_button"
          >
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  onLogout: () => void;
}

function PaymentHistoryRow({ principal }: { principal: Principal }) {
  const { data: payments = [], isLoading } = usePaymentsByMember(principal);

  if (isLoading) {
    return (
      <div
        className="px-4 py-3 space-y-2"
        data-ocid="admin.payments.history.loading_state"
      >
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full bg-white/10" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div
        className="px-4 py-4 text-center"
        data-ocid="admin.payments.history.empty_state"
      >
        <p className="text-white/40 text-sm">No payment records yet.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {payments.map((p) => (
        <div
          key={`${p.month.toString()}-${p.year.toString()}`}
          className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
        >
          <span className="text-white/70 text-sm">
            {MONTHS[Number(p.month) - 1]} {p.year.toString()}
          </span>
          <span className="text-gold font-semibold text-sm">
            ₹{p.amount.toString()}
          </span>
          {p.note && (
            <span className="text-white/40 text-xs hidden sm:block">
              {p.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function PaymentsTab() {
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const addPayment = useAddPayment();
  const [recordTarget, setRecordTarget] = useState<[Principal, Member] | null>(
    null,
  );
  const [expandedPrincipal, setExpandedPrincipal] = useState<string | null>(
    null,
  );
  const [payForm, setPayForm] = useState({
    amount: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    note: "",
  });

  const openRecord = (principal: Principal, member: Member) => {
    setRecordTarget([principal, member]);
    setPayForm({
      amount: member.monthlyContribution.toString(),
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      note: "",
    });
  };

  const handleSubmitPayment = async () => {
    if (!recordTarget) return;
    const [principal] = recordTarget;
    try {
      await addPayment.mutateAsync({
        memberPrincipal: principal,
        amount: BigInt(payForm.amount || "0"),
        month: BigInt(payForm.month),
        year: BigInt(payForm.year),
        note: payForm.note,
      });
      toast.success("Payment recorded!");
      setRecordTarget(null);
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedPrincipal((prev) => (prev === key ? null : key));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Payments</h2>
        <p className="text-white/50 text-sm">
          Record and view member contribution payments
        </p>
      </div>

      {membersLoading ? (
        <div className="space-y-2" data-ocid="admin.payments.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/10" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div
          className="glass-card-navy rounded-2xl p-12 text-center"
          data-ocid="admin.payments.empty_state"
        >
          <History size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No members found.</p>
        </div>
      ) : (
        <div className="glass-card-navy rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gold/80">#</TableHead>
                <TableHead className="text-gold/80">Name</TableHead>
                <TableHead className="text-gold/80 hidden sm:table-cell">
                  Monthly (₹)
                </TableHead>
                <TableHead className="text-right text-gold/80">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(([principal, member], idx) => {
                const key = principal.toString();
                const isExpanded = expandedPrincipal === key;
                return (
                  <React.Fragment key={key}>
                    <TableRow
                      className="border-white/10 hover:bg-white/5 cursor-pointer"
                      data-ocid={`admin.payments.item.${idx + 1}`}
                    >
                      <TableCell className="text-white/70 font-mono text-sm">
                        {member.serialNumber.toString()}
                      </TableCell>
                      <TableCell>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-white/40 text-xs">
                          @{member.username}
                        </p>
                      </TableCell>
                      <TableCell className="text-white/60 hidden sm:table-cell">
                        ₹{member.monthlyContribution.toString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            className="btn-gold text-xs h-7 px-2"
                            onClick={() => openRecord(principal, member)}
                            data-ocid={`admin.payments.record_button.${idx + 1}`}
                          >
                            <CreditCard size={12} className="mr-1" />
                            Record
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/40 hover:text-white h-7 px-2"
                            onClick={() => toggleExpand(key)}
                            data-ocid={`admin.payments.toggle.${idx + 1}`}
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {isExpanded && (
                        <TableRow
                          key={`${key}-history`}
                          className="border-white/10 bg-white/3"
                        >
                          <TableCell colSpan={4} className="p-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <PaymentHistoryRow principal={principal} />
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Dialog
        open={!!recordTarget}
        onOpenChange={(open) => !open && setRecordTarget(null)}
      >
        <DialogContent
          className="bg-card border-white/20 text-white max-w-sm"
          data-ocid="admin.payments.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              Record Payment — {recordTarget?.[1].name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/80">Amount (₹)</Label>
              <Input
                type="number"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                data-ocid="admin.payments.amount_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/80">Month</Label>
                <Select
                  value={payForm.month}
                  onValueChange={(v) => setPayForm({ ...payForm, month: v })}
                >
                  <SelectTrigger
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="admin.payments.month_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {MONTHS.map((m, i) => (
                      <SelectItem
                        key={m}
                        value={String(i + 1)}
                        className="text-white hover:bg-white/10"
                      >
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Year</Label>
                <Input
                  type="number"
                  value={payForm.year}
                  onChange={(e) =>
                    setPayForm({ ...payForm, year: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="admin.payments.year_input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Note (optional)</Label>
              <Input
                placeholder="e.g. Cash received"
                value={payForm.note}
                onChange={(e) =>
                  setPayForm({ ...payForm, note: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                data-ocid="admin.payments.note_input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setRecordTarget(null)}
              className="text-white/60"
              data-ocid="admin.payments.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleSubmitPayment}
              disabled={addPayment.isPending}
              data-ocid="admin.payments.submit_button"
            >
              {addPayment.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ManageAdminsTab() {
  const { data: callerProfile } = useCallerProfile();
  const { data: admins = [], isLoading } = useAdmins();
  const addAdmin = useAddAdmin();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    principalId: "",
    username: "",
    role: "admin",
  });

  const isSuperAdmin = callerProfile?.adminInfo?.role === "superadmin";

  const handleAddAdmin = async () => {
    if (!form.principalId.trim() || !form.username.trim()) {
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
      await addAdmin.mutateAsync({
        principal,
        username: form.username,
        role: form.role,
      });
      toast.success(`Admin ${form.username} added!`);
      setShowModal(false);
      setForm({ principalId: "", username: "", role: "admin" });
    } catch {
      toast.error("Failed to add admin");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Manage Admins</h2>
          <p className="text-white/50 text-sm">Super-admin control panel</p>
        </div>
        {isSuperAdmin && (
          <Button
            className="btn-gold"
            onClick={() => setShowModal(true)}
            data-ocid="admin.admins.open_modal_button"
          >
            <UserPlus size={15} className="mr-1" />
            Add Admin
          </Button>
        )}
      </div>

      {!isSuperAdmin ? (
        <div
          className="glass-card-navy rounded-2xl p-10 text-center"
          data-ocid="admin.admins.error_state"
        >
          <Shield size={36} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">
            Only super-admins can manage other admins.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2" data-ocid="admin.admins.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/10" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div
          className="glass-card-navy rounded-2xl p-10 text-center"
          data-ocid="admin.admins.empty_state"
        >
          <Shield size={36} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No admins registered yet.</p>
        </div>
      ) : (
        <div className="glass-card-navy rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gold/80">Username</TableHead>
                <TableHead className="text-gold/80">Role</TableHead>
                <TableHead className="text-gold/80 hidden sm:table-cell">
                  Principal ID
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(([principal, admin], idx) => (
                <TableRow
                  key={principal.toString()}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`admin.admins.item.${idx + 1}`}
                >
                  <TableCell className="text-white font-medium">
                    @{admin.username}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        admin.role === "superadmin"
                          ? "bg-gold/20 text-gold border-gold/30"
                          : "bg-white/10 text-white/60 border-white/20"
                      }
                    >
                      {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/40 font-mono text-xs hidden sm:table-cell">
                    {principal.toString().slice(0, 20)}…
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Admin Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="bg-card border-white/20 text-white max-w-sm"
          data-ocid="admin.admins.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/80">Principal ID *</Label>
              <Input
                placeholder="Admin's Internet Identity Principal"
                value={form.principalId}
                onChange={(e) =>
                  setForm({ ...form, principalId: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-xs"
                data-ocid="admin.admins.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Username *</Label>
              <Input
                placeholder="e.g. secretary"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="admin.admins.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  <SelectItem
                    value="admin"
                    className="text-white hover:bg-white/10"
                  >
                    Admin
                  </SelectItem>
                  <SelectItem
                    value="superadmin"
                    className="text-white hover:bg-white/10"
                  >
                    Super Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="text-white/60"
              data-ocid="admin.admins.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleAddAdmin}
              disabled={addAdmin.isPending}
              data-ocid="admin.admins.submit_button"
            >
              {addAdmin.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
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
  const [showChangePw, setShowChangePw] = useState(false);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChangePw(true)}
              className="text-white/60 hover:text-gold hover:bg-white/10"
              data-ocid="nav.change_password_button"
            >
              <KeyRound size={15} className="mr-1" />
              <span className="hidden sm:inline">Password</span>
            </Button>
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
          <TabsList
            className="mb-6 bg-white/10 flex-wrap h-auto gap-1"
            data-ocid="admin.tab"
          >
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              data-ocid="admin.members_tab"
            >
              <Users size={15} />
              Members
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              data-ocid="admin.payments_tab"
            >
              <CreditCard size={15} />
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              data-ocid="admin.admins_tab"
            >
              <Shield size={15} />
              Admins
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

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>

          {/* Manage Admins Tab */}
          <TabsContent value="admins">
            <ManageAdminsTab />
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
                  Configure UPI payment details and admin account
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

              {/* Change Password Section */}
              <div className="glass-card-navy rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <KeyRound size={16} className="text-gold" />
                    Admin Password
                  </h3>
                  <p className="text-white/40 text-xs mt-1">
                    Change your admin login password.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold w-full"
                  onClick={() => setShowChangePw(true)}
                  data-ocid="admin.settings.change_password_button"
                >
                  <KeyRound size={15} className="mr-2" />
                  Change Password
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePw}
        onClose={() => setShowChangePw(false)}
      />

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
