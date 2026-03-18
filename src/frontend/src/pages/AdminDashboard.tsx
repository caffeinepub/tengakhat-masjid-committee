import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertCircle,
  BarChart3,
  CheckCircle,
  Copy,
  CreditCard,
  Edit,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Member,
  Variant_active_inactive,
  formatAmount,
  formatDate,
  useActivityLog,
  useAddMember,
  useAllPayments,
  useDashboardStats,
  useDeleteMember,
  useMembers,
  useMonthlyCollection,
  useRecordPayment,
  useSetUPIConfig,
  useUPIConfig,
  useUpdateMember,
} from "../hooks/useQueries";

type Tab = "dashboard" | "members" | "payments" | "reports" | "settings";

const PIE_COLORS = ["#D4AF37", "#0A6A3B", "#1E3A8A", "#0B8F4F", "#C9A227"];

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  const { clear } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: monthlyData = [] } = useMonthlyCollection();
  const { data: allPayments = [], isLoading: paymentsLoading } =
    useAllPayments();
  const { data: activityLog = [] } = useActivityLog();
  const { data: upiConfig } = useUPIConfig();

  const addMember = useAddMember();
  const deleteMember = useDeleteMember();
  const updateMember = useUpdateMember();
  const recordPayment = useRecordPayment();
  const setUPI = useSetUPIConfig();

  // Search
  const [memberSearch, setMemberSearch] = useState("");

  // Add Member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    monthly_amount: "",
  });

  // Edit Member modal
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    monthly_amount: "",
    status: Variant_active_inactive.active,
  });

  // Delete Member modal
  const [deletePhone, setDeletePhone] = useState<string | null>(null);

  // Record Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    member_phone: "",
    amount: "",
    upi_txn_id: "",
    note: "",
  });

  // UPI Settings
  const [upiForm, setUpiForm] = useState({
    upi_id: upiConfig?.upi_id ?? "",
    merchant_name: upiConfig?.merchant_name ?? "Tengakhat Masjid Committee",
    description: upiConfig?.description ?? "Monthly Contribution",
  });

  const handleLogout = () => {
    clear();
    onLogout();
  };

  const handleAddMember = async () => {
    if (!addForm.name || !addForm.phone || !addForm.monthly_amount) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await addMember.mutateAsync({
        name: addForm.name,
        phone: addForm.phone,
        monthly_amount: Number(addForm.monthly_amount),
      });
      toast.success("Member added successfully!");
      setShowAddModal(false);
      setAddForm({ name: "", phone: "", monthly_amount: "" });
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleEditMember = async () => {
    if (!editMember) return;
    try {
      await updateMember.mutateAsync({
        phone: editMember.phone,
        name: editForm.name,
        monthly_amount: Number(editForm.monthly_amount),
        status: editForm.status,
      });
      toast.success("Member updated!");
      setEditMember(null);
    } catch {
      toast.error("Failed to update member");
    }
  };

  const handleDeleteMember = async () => {
    if (!deletePhone) return;
    try {
      await deleteMember.mutateAsync(deletePhone);
      toast.success("Member deleted");
      setDeletePhone(null);
    } catch {
      toast.error("Failed to delete member");
    }
  };

  const handleRecordPayment = async () => {
    if (!payForm.member_phone || !payForm.amount) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        member_phone: payForm.member_phone,
        amount: Number(payForm.amount),
        upi_txn_id: payForm.upi_txn_id || undefined,
        note: payForm.note || undefined,
      });
      toast.success("Payment recorded!");
      setShowPayModal(false);
      setPayForm({ member_phone: "", amount: "", upi_txn_id: "", note: "" });
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const handleSaveUPI = async () => {
    try {
      await setUPI.mutateAsync(upiForm);
      toast.success("UPI settings saved!");
    } catch {
      toast.error("Failed to save UPI settings");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.phone.includes(memberSearch) ||
      String(m.serial_no).includes(memberSearch),
  );

  // Chart data
  const chartData = monthlyData.slice(-12).map((d) => ({
    name: d.month.substring(0, 3),
    amount: Number(d.amount),
  }));

  const pieData = members.slice(0, 5).map((m, i) => ({
    name: m.name.split(" ")[0],
    value: Number(m.monthly_amount),
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "members", icon: Users, label: "Members" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "reports", icon: BarChart3, label: "Reports" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className="min-h-screen flex font-poppins"
      style={{ background: "#0B2A5B" }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static`}
        style={{
          background: "linear-gradient(180deg, #071D3F 0%, #0B2A5B 100%)",
          borderRight: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gold/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-gold overflow-hidden flex-shrink-0">
              <img
                src="/assets/generated/tmc-logo-transparent.dim_200x200.png"
                alt="TMC"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-gold font-bold text-xs leading-tight truncate">
                TENGAKHAT MASJID
              </p>
              <p className="text-gold/60 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`sidebar-link w-full text-left ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id as Tab);
                setSidebarOpen(false);
              }}
              data-ocid={`nav.${item.id}.link`}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gold/10">
          <button
            type="button"
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
            data-ocid="nav.logout.button"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gold/10"
          style={{
            background: "rgba(11,42,91,0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-white font-bold text-lg capitalize">
              {activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gold text-xs font-semibold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
              Admin
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ===== DASHBOARD ===== */}
              {activeTab === "dashboard" && (
                <div className="space-y-6" data-ocid="dashboard.section">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsLoading
                      ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
                          <Skeleton key={i} className="h-28 rounded-2xl" />
                        ))
                      : [
                          {
                            label: "Total Members",
                            value: String(stats?.total_members ?? 0),
                            icon: UserCheck,
                            color: "text-blue-300",
                          },
                          {
                            label: "This Month",
                            value: formatAmount(
                              stats?.total_collected_this_month ?? 0n,
                            ),
                            icon: TrendingUp,
                            color: "text-green-300",
                          },
                          {
                            label: "This Year",
                            value: formatAmount(
                              stats?.total_collected_this_year ?? 0n,
                            ),
                            icon: BarChart3,
                            color: "text-gold",
                          },
                          {
                            label: "Outstanding",
                            value: formatAmount(
                              stats?.total_outstanding_balance ?? 0n,
                            ),
                            icon: Wallet,
                            color: "text-red-400",
                          },
                        ].map((s, i) => (
                          <div
                            key={s.label}
                            className="stat-card"
                            data-ocid={`dashboard.stat.${i + 1}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <s.icon size={20} className={s.color} />
                              <span className="text-white/30 text-xs">
                                {s.label}
                              </span>
                            </div>
                            <p className={`text-2xl font-extrabold ${s.color}`}>
                              {s.value}
                            </p>
                          </div>
                        ))}
                  </div>

                  {/* Charts */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div
                      className="rounded-2xl p-5 border border-gold/20"
                      style={{ background: "rgba(46,107,75,0.15)" }}
                    >
                      <h3 className="text-gold font-semibold mb-4">
                        Monthly Collections (₹)
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={
                            chartData.length
                              ? chartData
                              : [{ name: "Jan", amount: 0 }]
                          }
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#0B2A5B",
                              border: "1px solid rgba(212,175,55,0.3)",
                              borderRadius: 8,
                            }}
                            labelStyle={{ color: "#D4AF37" }}
                            itemStyle={{ color: "#fff" }}
                          />
                          <Bar
                            dataKey="amount"
                            fill="#0A6A3B"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Activity Log */}
                    <div
                      className="rounded-2xl p-5 border border-gold/20"
                      style={{ background: "rgba(11,42,91,0.6)" }}
                    >
                      <h3 className="text-gold font-semibold mb-4">
                        Recent Activity
                      </h3>
                      <div className="space-y-3 max-h-52 overflow-auto">
                        {activityLog.length === 0 ? (
                          <p
                            className="text-white/40 text-sm text-center py-6"
                            data-ocid="activity.empty_state"
                          >
                            No activity yet
                          </p>
                        ) : (
                          activityLog.slice(0, 8).map((log, i) => (
                            <div
                              key={String(log.id)}
                              className="flex gap-3"
                              data-ocid={`activity.item.${i + 1}`}
                            >
                              <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                              <div>
                                <p className="text-white/80 text-sm">
                                  {log.action}
                                </p>
                                <p className="text-white/40 text-xs">
                                  {formatDate(log.timestamp)} · {log.details}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== MEMBERS ===== */}
              {activeTab === "members" && (
                <div className="space-y-4" data-ocid="members.section">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <Input
                        placeholder="Search by name, phone, serial..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                        data-ocid="members.search_input"
                      />
                    </div>
                    <Button
                      className="btn-gold flex-shrink-0"
                      onClick={() => setShowAddModal(true)}
                      data-ocid="members.add_button"
                    >
                      <Plus size={16} className="mr-2" /> Add Member
                    </Button>
                  </div>

                  <div
                    className="rounded-2xl border border-gold/20 overflow-hidden"
                    style={{ background: "rgba(11,42,91,0.6)" }}
                  >
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm"
                        data-ocid="members.table"
                      >
                        <thead>
                          <tr style={{ background: "rgba(10,106,59,0.3)" }}>
                            {[
                              "S.No",
                              "Name",
                              "Phone",
                              "Monthly (₹)",
                              "Status",
                              "Actions",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-gold/80 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {membersLoading ? (
                            Array.from({ length: 5 }, (_, i) => i).map((i) => (
                              <tr key={`skeleton-${i}`}>
                                <td colSpan={6} className="px-4 py-2">
                                  <Skeleton className="h-8" />
                                </td>
                              </tr>
                            ))
                          ) : filteredMembers.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-white/40"
                                data-ocid="members.empty_state"
                              >
                                No members found
                              </td>
                            </tr>
                          ) : (
                            filteredMembers.map((m, i) => (
                              <tr
                                key={m.phone}
                                className="border-t border-white/5 hover:bg-white/5 transition-colors"
                                data-ocid={`members.item.${i + 1}`}
                              >
                                <td className="px-4 py-3 text-gold font-bold">
                                  #{String(m.serial_no)}
                                </td>
                                <td className="px-4 py-3 text-white font-medium">
                                  {m.name}
                                </td>
                                <td className="px-4 py-3 text-white/70">
                                  {m.phone}
                                </td>
                                <td className="px-4 py-3 text-white/90">
                                  {formatAmount(m.monthly_amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    className={
                                      m.status ===
                                      Variant_active_inactive.active
                                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                                        : "bg-red-500/20 text-red-300 border-red-500/30"
                                    }
                                  >
                                    {m.status ===
                                    Variant_active_inactive.active ? (
                                      <>
                                        <CheckCircle
                                          size={10}
                                          className="mr-1"
                                        />{" "}
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={10} className="mr-1" />{" "}
                                        Inactive
                                      </>
                                    )}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      className="p-1.5 text-gold/70 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                                      onClick={() => {
                                        setEditMember(m);
                                        setEditForm({
                                          name: m.name,
                                          monthly_amount: String(
                                            m.monthly_amount,
                                          ),
                                          status: m.status,
                                        });
                                      }}
                                      data-ocid={`members.edit_button.${i + 1}`}
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                      onClick={() => setDeletePhone(m.phone)}
                                      data-ocid={`members.delete_button.${i + 1}`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== PAYMENTS ===== */}
              {activeTab === "payments" && (
                <div className="space-y-4" data-ocid="payments.section">
                  <div className="flex justify-end">
                    <Button
                      className="btn-gold"
                      onClick={() => setShowPayModal(true)}
                      data-ocid="payments.add_button"
                    >
                      <Plus size={16} className="mr-2" /> Record Payment
                    </Button>
                  </div>
                  <div
                    className="rounded-2xl border border-gold/20 overflow-hidden"
                    style={{ background: "rgba(11,42,91,0.6)" }}
                  >
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm"
                        data-ocid="payments.table"
                      >
                        <thead>
                          <tr style={{ background: "rgba(10,106,59,0.3)" }}>
                            {[
                              "#",
                              "Member Phone",
                              "Amount",
                              "Date",
                              "UPI Txn ID",
                              "Note",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-gold/80 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paymentsLoading ? (
                            Array.from({ length: 5 }, (_, i) => i).map((i) => (
                              <tr key={`skeleton-${i}`}>
                                <td colSpan={6} className="px-4 py-2">
                                  <Skeleton className="h-8" />
                                </td>
                              </tr>
                            ))
                          ) : allPayments.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-white/40"
                                data-ocid="payments.empty_state"
                              >
                                No payments recorded yet
                              </td>
                            </tr>
                          ) : (
                            allPayments.map((p, i) => (
                              <tr
                                key={String(p.id)}
                                className="border-t border-white/5 hover:bg-white/5"
                                data-ocid={`payments.item.${i + 1}`}
                              >
                                <td className="px-4 py-3 text-gold/70">
                                  #{String(p.id)}
                                </td>
                                <td className="px-4 py-3 text-white/80">
                                  {p.member_phone}
                                </td>
                                <td className="px-4 py-3 text-green-300 font-semibold">
                                  {formatAmount(p.amount)}
                                </td>
                                <td className="px-4 py-3 text-white/60">
                                  {formatDate(p.date)}
                                </td>
                                <td className="px-4 py-3 text-white/50 text-xs font-mono">
                                  {p.upi_txn_id ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-white/50">
                                  {p.note ?? "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== REPORTS ===== */}
              {activeTab === "reports" && (
                <div className="space-y-6" data-ocid="reports.section">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div
                      className="rounded-2xl p-5 border border-gold/20"
                      style={{ background: "rgba(46,107,75,0.15)" }}
                    >
                      <h3 className="text-gold font-semibold mb-4">
                        Monthly Collection Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={
                            chartData.length
                              ? chartData
                              : [{ name: "No Data", amount: 0 }]
                          }
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#0B2A5B",
                              border: "1px solid rgba(212,175,55,0.3)",
                              borderRadius: 8,
                            }}
                            formatter={(v) => [
                              `₹${Number(v).toLocaleString("en-IN")}`,
                              "Amount",
                            ]}
                          />
                          <Bar
                            dataKey="amount"
                            fill="#D4AF37"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div
                      className="rounded-2xl p-5 border border-gold/20"
                      style={{ background: "rgba(11,42,91,0.6)" }}
                    >
                      <h3 className="text-gold font-semibold mb-4">
                        Member Contribution Breakdown
                      </h3>
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#0B2A5B",
                                border: "1px solid rgba(212,175,55,0.3)",
                                borderRadius: 8,
                              }}
                              formatter={(v) => [
                                `₹${Number(v).toLocaleString("en-IN")}`,
                                "Amount",
                              ]}
                            />
                            <Legend
                              wrapperStyle={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div
                          className="flex items-center justify-center h-60 text-white/40"
                          data-ocid="reports.empty_state"
                        >
                          <div className="text-center">
                            <AlertCircle
                              size={32}
                              className="mx-auto mb-2 text-white/20"
                            />
                            <p>Add members to see chart</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div
                    className="rounded-2xl p-5 border border-gold/20"
                    style={{ background: "rgba(46,107,75,0.15)" }}
                  >
                    <h3 className="text-gold font-semibold mb-4">
                      Summary Statistics
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Active Members",
                          value: members.filter(
                            (m) => m.status === Variant_active_inactive.active,
                          ).length,
                        },
                        {
                          label: "Inactive Members",
                          value: members.filter(
                            (m) =>
                              m.status === Variant_active_inactive.inactive,
                          ).length,
                        },
                        { label: "Total Payments", value: allPayments.length },
                        {
                          label: "Avg Contribution",
                          value: members.length
                            ? `₹${Math.round(members.reduce((s, m) => s + Number(m.monthly_amount), 0) / members.length).toLocaleString("en-IN")}`
                            : "₹0",
                        },
                      ].map((s, i) => (
                        <div
                          key={s.label}
                          className="bg-white/5 rounded-xl p-4 text-center"
                          data-ocid={`reports.stat.${i + 1}`}
                        >
                          <p className="text-2xl font-bold text-white">
                            {s.value}
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SETTINGS ===== */}
              {activeTab === "settings" && (
                <div className="max-w-lg" data-ocid="settings.section">
                  <div
                    className="rounded-2xl p-6 border border-gold/20"
                    style={{ background: "rgba(11,42,91,0.6)" }}
                  >
                    <h3 className="text-gold font-bold text-xl mb-6">
                      UPI Payment Configuration
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/80">UPI ID</Label>
                        <Input
                          value={upiForm.upi_id}
                          onChange={(e) =>
                            setUpiForm({ ...upiForm, upi_id: e.target.value })
                          }
                          placeholder="example@upi"
                          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                          data-ocid="settings.upi_id.input"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Merchant Name</Label>
                        <Input
                          value={upiForm.merchant_name}
                          onChange={(e) =>
                            setUpiForm({
                              ...upiForm,
                              merchant_name: e.target.value,
                            })
                          }
                          placeholder="Tengakhat Masjid Committee"
                          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                          data-ocid="settings.merchant_name.input"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">
                          Payment Description
                        </Label>
                        <Input
                          value={upiForm.description}
                          onChange={(e) =>
                            setUpiForm({
                              ...upiForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Monthly Contribution"
                          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                          data-ocid="settings.description.input"
                        />
                      </div>
                      <Button
                        className="w-full btn-gold mt-2"
                        onClick={handleSaveUPI}
                        disabled={setUPI.isPending}
                        data-ocid="settings.save_button"
                      >
                        {setUPI.isPending ? "Saving..." : "Save UPI Settings"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ===== MODALS ===== */}

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent
          className="bg-card border-gold/20 text-white"
          data-ocid="add_member.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-gold">Add New Member</DialogTitle>
            <DialogDescription className="text-white/50">
              Enter member details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/80">Full Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                placeholder="Mohammed Abdullah"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="add_member.name.input"
              />
            </div>
            <div>
              <Label className="text-white/80">Phone Number *</Label>
              <Input
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm({ ...addForm, phone: e.target.value })
                }
                placeholder="9876543210"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="add_member.phone.input"
              />
            </div>
            <div>
              <Label className="text-white/80">
                Monthly Contribution (₹) *
              </Label>
              <Input
                type="number"
                value={addForm.monthly_amount}
                onChange={(e) =>
                  setAddForm({ ...addForm, monthly_amount: e.target.value })
                }
                placeholder="500"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="add_member.amount.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => setShowAddModal(false)}
              data-ocid="add_member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleAddMember}
              disabled={addMember.isPending}
              data-ocid="add_member.submit_button"
            >
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
        <DialogContent
          className="bg-card border-gold/20 text-white"
          data-ocid="edit_member.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-gold">Edit Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/80">Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="mt-1 bg-white/5 border-white/20 text-white"
                data-ocid="edit_member.name.input"
              />
            </div>
            <div>
              <Label className="text-white/80">Monthly Amount (₹)</Label>
              <Input
                type="number"
                value={editForm.monthly_amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, monthly_amount: e.target.value })
                }
                className="mt-1 bg-white/5 border-white/20 text-white"
                data-ocid="edit_member.amount.input"
              />
            </div>
            <div>
              <Label className="text-white/80">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    status: v as Variant_active_inactive,
                  })
                }
              >
                <SelectTrigger
                  className="mt-1 bg-white/5 border-white/20 text-white"
                  data-ocid="edit_member.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  <SelectItem
                    value={Variant_active_inactive.active}
                    className="text-white"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value={Variant_active_inactive.inactive}
                    className="text-white"
                  >
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => setEditMember(null)}
              data-ocid="edit_member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleEditMember}
              disabled={updateMember.isPending}
              data-ocid="edit_member.save_button"
            >
              {updateMember.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletePhone} onOpenChange={() => setDeletePhone(null)}>
        <DialogContent
          className="bg-card border-red-500/20 text-white"
          data-ocid="delete_member.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Member</DialogTitle>
            <DialogDescription className="text-white/50">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-white/70 py-2">
            Are you sure you want to delete member with phone{" "}
            <span className="text-gold font-semibold">{deletePhone}</span>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => setDeletePhone(null)}
              data-ocid="delete_member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteMember}
              disabled={deleteMember.isPending}
              data-ocid="delete_member.confirm_button"
            >
              {deleteMember.isPending ? "Deleting..." : "Delete Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent
          className="bg-card border-gold/20 text-white"
          data-ocid="record_payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-gold">Record Payment</DialogTitle>
            <DialogDescription className="text-white/50">
              Log a contribution payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/80">Member Phone *</Label>
              <Select
                value={payForm.member_phone}
                onValueChange={(v) =>
                  setPayForm({ ...payForm, member_phone: v })
                }
              >
                <SelectTrigger
                  className="mt-1 bg-white/5 border-white/20 text-white"
                  data-ocid="record_payment.member.select"
                >
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {members.map((m) => (
                    <SelectItem
                      key={m.phone}
                      value={m.phone}
                      className="text-white"
                    >
                      {m.name} ({m.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Amount (₹) *</Label>
              <Input
                type="number"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: e.target.value })
                }
                placeholder="500"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="record_payment.amount.input"
              />
            </div>
            <div>
              <Label className="text-white/80">
                UPI Transaction ID (optional)
              </Label>
              <Input
                value={payForm.upi_txn_id}
                onChange={(e) =>
                  setPayForm({ ...payForm, upi_txn_id: e.target.value })
                }
                placeholder="UPI Txn ID"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="record_payment.txn_id.input"
              />
            </div>
            <div>
              <Label className="text-white/80">Note (optional)</Label>
              <Input
                value={payForm.note}
                onChange={(e) =>
                  setPayForm({ ...payForm, note: e.target.value })
                }
                placeholder="e.g. Ramadan contribution"
                className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                data-ocid="record_payment.note.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => setShowPayModal(false)}
              data-ocid="record_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleRecordPayment}
              disabled={recordPayment.isPending}
              data-ocid="record_payment.submit_button"
            >
              {recordPayment.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
