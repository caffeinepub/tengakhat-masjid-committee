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
}

const emptyForm: MemberForm = {
  name: "",
  phone: "",
  address: "",
  monthlyFee: "",
};

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
    setForm({
      name: member.name,
      phone: member.phone,
      address: member.address,
      monthlyFee: String(member.monthlyFee),
    });
    setFormError("");
    const photos = getPhotos();
    setPhotoPreview(photos[String(member.memberId)] ?? null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const fee = Number.parseInt(form.monthlyFee, 10);
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
          const photos = getPhotos();
          photos[String(editMember.memberId)] = photoPreview;
          localStorage.setItem("tmc_member_photos", JSON.stringify(photos));
        }
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
          const photos = getPhotos();
          photos[String(newId)] = photoPreview;
          localStorage.setItem("tmc_member_photos", JSON.stringify(photos));
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
      const photos = getPhotos();
      delete photos[String(deleteTarget.memberId)];
      localStorage.setItem("tmc_member_photos", JSON.stringify(photos));
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

  const isSaving = addMember.isPending || updateMember.isPending;
  const photos = getPhotos();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Members</h2>
          <p className="text-muted-foreground text-sm">
            {members?.length ?? 0} member
            {(members?.length ?? 0) !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button
          data-ocid="members.add.open_modal_button"
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 text-white"
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
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Address
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    Monthly Fee
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, idx) => (
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.phone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                      {member.address || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{Number(member.monthlyFee).toLocaleString()}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((member, idx) => (
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
            ))}
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
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
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editMember ? "Updating..." : "Adding..."}
                  </>
                ) : editMember ? (
                  "Update Member"
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
              className="bg-destructive hover:bg-destructive/90 text-white"
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
        <AlertDialogContent data-ocid="members.pin-reset.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Member PIN</AlertDialogTitle>
            <AlertDialogDescription>
              Reset PIN for <strong>{pinResetTarget?.name}</strong>? Their PIN
              will be reset to <strong>1234</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="members.pin-reset.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="members.pin-reset.confirm_button"
              onClick={handlePinReset}
              className="bg-amber-600 hover:bg-amber-700 text-white"
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
