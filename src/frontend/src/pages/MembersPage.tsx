import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CreditCard,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Member } from "../backend";
import PaymentModal from "../components/PaymentModal";
import {
  useAddMember,
  useDeleteMember,
  useMembers,
  useUpdateMember,
} from "../hooks/useQueries";

interface MemberForm {
  name: string;
  phone: string;
  address: string;
  monthlyFee: string;
  previousBalance: string;
  loginId: string;
}

const emptyForm: MemberForm = {
  name: "",
  phone: "",
  address: "",
  monthlyFee: "",
  previousBalance: "0",
  loginId: "",
};

// Previous balances stored in localStorage by memberId (frontend-managed)
function getPrevBalances(): Record<string, number> {
  return JSON.parse(localStorage.getItem("tmc_prev_balances") ?? "{}");
}

function getLoginIds(): Record<string, string> {
  return JSON.parse(localStorage.getItem("tmc_member_login_ids") ?? "{}");
}

function saveLoginIds(ids: Record<string, string>) {
  localStorage.setItem("tmc_member_login_ids", JSON.stringify(ids));
}

// Validate login ID: letters only OR 001-999
function isValidLoginId(id: string): boolean {
  return (
    /^[a-zA-Z]+$/.test(id) ||
    /^(0[0-9][1-9]|0[1-9][0-9]|[1-9][0-9]{2})$/.test(id)
  );
}

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Member | null>(null);
  const [pinResetTarget, setPinResetTarget] = useState<Member | null>(null);
  const [formError, setFormError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: members, isLoading } = useMembers();
  const addMember = useAddMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  // Photos stored in localStorage by memberId
  const getPhotos = (): Record<string, string> =>
    JSON.parse(localStorage.getItem("tmc_member_photos") ?? "{}");

  const photos = getPhotos();
  const prevBalances = getPrevBalances();

  const filtered = (members ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search),
  );

  function openAddModal() {
    setEditMember(null);
    setForm(emptyForm);
    setFormError("");
    setPhotoPreview(null);
    setModalOpen(true);
  }

  function openEditModal(member: Member) {
    setEditMember(member);
    const prevBals = getPrevBalances();
    // Find the current loginId for this member
    const loginIds = getLoginIds();
    const memberIdStr = String(member.memberId);
    const existingLoginId =
      Object.entries(loginIds).find(([, v]) => v === memberIdStr)?.[0] ?? "";
    setForm({
      name: member.name,
      phone: member.phone,
      address: member.address,
      monthlyFee: String(member.monthlyFee),
      previousBalance: String(prevBals[memberIdStr] ?? 0),
      loginId: existingLoginId,
    });
    setFormError("");
    const photos2 = getPhotos();
    setPhotoPreview(photos2[memberIdStr] ?? null);
    setModalOpen(true);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Auto-fill loginId from name if loginId is empty
  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      loginId: f.loginId === "" ? name.split(" ")[0].toLowerCase() : f.loginId,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const fee = Number.parseInt(form.monthlyFee, 10);
    const prevBalParsed = Number.parseInt(form.previousBalance, 10);
    const previousBalance = Number.isNaN(prevBalParsed)
      ? 0
      : Math.max(0, prevBalParsed);

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setFormError("Phone is required.");
      return;
    }
    if (Number.isNaN(fee) || fee <= 0) {
      setFormError("Monthly fee must be a positive number.");
      return;
    }

    // Validate loginId
    const loginIdVal = form.loginId.trim();
    if (!loginIdVal) {
      setFormError("Member Login ID is required.");
      return;
    }
    if (!isValidLoginId(loginIdVal)) {
      setFormError(
        "Login ID must be letters only (first name) or a 3-digit number (001–999).",
      );
      return;
    }

    // Check login ID uniqueness (not taken by another member)
    const loginIds = getLoginIds();
    const takenBy = loginIds[loginIdVal.toLowerCase()];
    const memberIdStr = editMember ? String(editMember.memberId) : null;
    if (takenBy && takenBy !== memberIdStr) {
      setFormError(
        `Login ID "${loginIdVal}" is already taken by another member. Please choose a different one.`,
      );
      return;
    }

    try {
      if (editMember) {
        await updateMember.mutateAsync({
          memberId: editMember.memberId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          monthlyFee: fee,
        });
        // Save photo
        if (photoPreview) {
          const photosMap = getPhotos();
          photosMap[String(editMember.memberId)] = photoPreview;
          localStorage.setItem("tmc_member_photos", JSON.stringify(photosMap));
        }
        // Save previous balance
        const prevBals = getPrevBalances();
        prevBals[String(editMember.memberId)] = previousBalance;
        localStorage.setItem("tmc_prev_balances", JSON.stringify(prevBals));
        // Save login ID (remove old entry first)
        const ids = getLoginIds();
        // Remove old entry pointing to this member
        for (const key of Object.keys(ids)) {
          if (ids[key] === String(editMember.memberId)) {
            delete ids[key];
          }
        }
        ids[loginIdVal.toLowerCase()] = String(editMember.memberId);
        saveLoginIds(ids);
        toast.success("Member updated successfully");
      } else {
        const newId = await addMember.mutateAsync({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          monthlyFee: fee,
        });
        // Save photo for new member
        if (photoPreview && newId) {
          const photosMap = getPhotos();
          photosMap[String(newId)] = photoPreview;
          localStorage.setItem("tmc_member_photos", JSON.stringify(photosMap));
        }
        // Save previous balance for new member
        if (newId) {
          const prevBals = getPrevBalances();
          prevBals[String(newId)] = previousBalance;
          localStorage.setItem("tmc_prev_balances", JSON.stringify(prevBals));
          // Save login ID
          const ids = getLoginIds();
          ids[loginIdVal.toLowerCase()] = String(newId);
          saveLoginIds(ids);
        }
        toast.success("Member added successfully");
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFormError(`Failed to ${editMember ? "update" : "add"} member: ${msg}`);
      toast.error(
        editMember ? "Failed to update member" : "Failed to add member",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMember.mutateAsync(deleteTarget.memberId);
      // Remove photo
      const photosMap = getPhotos();
      delete photosMap[String(deleteTarget.memberId)];
      localStorage.setItem("tmc_member_photos", JSON.stringify(photosMap));
      // Remove previous balance
      const prevBals = getPrevBalances();
      delete prevBals[String(deleteTarget.memberId)];
      localStorage.setItem("tmc_prev_balances", JSON.stringify(prevBals));
      // Remove login ID
      const ids = getLoginIds();
      for (const key of Object.keys(ids)) {
        if (ids[key] === String(deleteTarget.memberId)) {
          delete ids[key];
        }
      }
      saveLoginIds(ids);
      toast.success("Member deleted");
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to delete member: ${msg}`);
    }
  }

  function handlePinReset() {
    if (!pinResetTarget) return;
    const pins: Record<string, string> = JSON.parse(
      localStorage.getItem("tmc_member_pins") ?? "{}",
    );
    pins[String(pinResetTarget.memberId)] = "1234";
    localStorage.setItem("tmc_member_pins", JSON.stringify(pins));
    toast.success(`PIN reset to 1234 for ${pinResetTarget.name}`);
    setPinResetTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground">
            {members?.length ?? 0} total members
          </p>
        </div>
        <Button
          onClick={openAddModal}
          data-ocid="members.add.primary_button"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="members.search_input"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <div data-ocid="members.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="members.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium">No members found</p>
          <p className="text-sm mt-1">
            {search
              ? "Try a different search term"
              : "Click 'Add Member' to get started"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm" data-ocid="members.table">
              <thead className="bg-secondary/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Photo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Member ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Login ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Address
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    Monthly Fee
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    Prev. Balance
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, idx) => {
                  const prevBal = prevBalances[String(member.memberId)] ?? 0;
                  const loginIds2 = getLoginIds();
                  const memberLoginId =
                    Object.entries(loginIds2).find(
                      ([, v]) => v === String(member.memberId),
                    )?.[0] ?? "—";
                  return (
                    <tr
                      key={String(member.memberId)}
                      data-ocid={`members.item.${idx + 1}`}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div
                          className="w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center"
                          style={{ borderColor: "#D4AF37" }}
                        >
                          {photos[String(member.memberId)] ? (
                            <img
                              src={photos[String(member.memberId)]}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-green-50">
                              <User className="w-5 h-5 text-green-700" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{String(member.memberId)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className="font-mono text-xs"
                          style={{
                            background: "#e8f5ee",
                            color: "#004d26",
                            border: "1px solid #b8dfc9",
                          }}
                        >
                          {memberLoginId}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                        {member.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{Number(member.monthlyFee).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {prevBal > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            ₹{prevBal.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`members.item.${idx + 1}.edit_button`}
                            onClick={() => openEditModal(member)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`members.item.${idx + 1}.delete_button`}
                            onClick={() => setDeleteTarget(member)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`members.item.${idx + 1}.payment_button`}
                            onClick={() => setPaymentTarget(member)}
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`members.item.${idx + 1}.button`}
                            onClick={() => setPinResetTarget(member)}
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                            title="Reset PIN"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((member, idx) => {
              const prevBal = prevBalances[String(member.memberId)] ?? 0;
              const loginIds2 = getLoginIds();
              const memberLoginId =
                Object.entries(loginIds2).find(
                  ([, v]) => v === String(member.memberId),
                )?.[0] ?? "—";
              return (
                <div
                  key={String(member.memberId)}
                  data-ocid={`members.item.${idx + 1}`}
                  className="bg-white rounded-xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{ borderColor: "#D4AF37" }}
                    >
                      {photos[String(member.memberId)] ? (
                        <img
                          src={photos[String(member.memberId)]}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-50">
                          <User className="w-6 h-6 text-green-700" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{String(member.memberId)}
                        </Badge>
                        <span className="font-semibold text-foreground truncate">
                          {member.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Login ID:{" "}
                        <span className="font-mono font-medium text-green-800">
                          {memberLoginId}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.phone}
                      </p>
                      {member.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {member.address}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary mt-1">
                        ₹{Number(member.monthlyFee).toLocaleString()}/mo
                      </p>
                      {prevBal > 0 && (
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">
                          Prev. Balance: ₹{prevBal.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(member)}
                        className="h-8 w-8 text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(member)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPaymentTarget(member)}
                        className="h-8 w-8 text-primary"
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPinResetTarget(member)}
                        className="h-8 w-8 text-amber-600"
                        title="Reset PIN"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Member Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid={editMember ? "members.edit.dialog" : "members.add.dialog"}
        >
          <DialogHeader>
            <DialogTitle>
              {editMember ? "Edit Member" : "Add New Member"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                className="w-20 h-20 rounded-full overflow-hidden border-4 flex items-center justify-center cursor-pointer p-0"
                style={{ borderColor: "#D4AF37" }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload photo"
                aria-label="Upload member photo"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-green-50">
                    <User className="w-8 h-8 text-green-600" />
                  </div>
                )}
              </button>
              <button
                type="button"
                className="text-xs text-primary underline"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? "Change Photo" : "Upload Photo (optional)"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-name">Full Name *</Label>
              <Input
                id="m-name"
                data-ocid="members.name.input"
                placeholder="e.g. Mohammed Rashid"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-login-id">Member Login ID *</Label>
              <Input
                id="m-login-id"
                data-ocid="members.login_id.input"
                placeholder="e.g. rashid or 042"
                value={form.loginId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, loginId: e.target.value }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                First name (letters only) or a 3-digit number (001–999). Used by
                member to log in.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-phone">Phone Number *</Label>
              <Input
                id="m-phone"
                data-ocid="members.phone.input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-address">Address</Label>
              <Input
                id="m-address"
                data-ocid="members.address.input"
                placeholder="e.g. 12 Mosque Road, Tengakhat"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-fee">Monthly Fee (₹) *</Label>
              <Input
                id="m-fee"
                data-ocid="members.fee.input"
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={form.monthlyFee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlyFee: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-prev-bal">Previous Balance (₹)</Label>
              <Input
                id="m-prev-bal"
                data-ocid="members.previousBalance.input"
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={form.previousBalance}
                onChange={(e) =>
                  setForm((f) => ({ ...f, previousBalance: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter any outstanding balance from before the app
              </p>
            </div>
            {formError && (
              <p
                data-ocid="members.form.error_state"
                className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
              >
                {formError}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="members.form.cancel_button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="members.form.submit_button"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={addMember.isPending || updateMember.isPending}
              >
                {addMember.isPending || updateMember.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editMember ? (
                  "Save Changes"
                ) : (
                  "Add Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="members.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="members.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="members.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMember.isPending}
            >
              {deleteMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIN Reset Confirmation */}
      <AlertDialog
        open={!!pinResetTarget}
        onOpenChange={(open) => !open && setPinResetTarget(null)}
      >
        <AlertDialogContent data-ocid="members.pin_reset.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Member PIN</AlertDialogTitle>
            <AlertDialogDescription>
              Reset the PIN for <strong>{pinResetTarget?.name}</strong> back to
              the default <strong>1234</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="members.pin_reset.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="members.pin_reset.confirm_button"
              onClick={handlePinReset}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Reset PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          member={paymentTarget}
          onClose={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}
