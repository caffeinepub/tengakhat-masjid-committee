import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMembers, usePaymentsByMonthYear } from "../hooks/useQueries";

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

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: payments, isLoading: paymentsLoading } = usePaymentsByMonthYear(
    month,
    year,
  );

  const totalMembers = members?.length ?? 0;

  const paymentMap = new Map<string, bigint>();
  for (const p of payments ?? []) {
    paymentMap.set(String(p.memberId), p.amountPaid);
  }

  const paymentStatusMap = new Map<string, string>();
  for (const p of payments ?? []) {
    paymentStatusMap.set(String(p.memberId), p.status);
  }

  let totalCollected = 0n;
  let totalPending = 0n;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  for (const member of members ?? []) {
    const key = String(member.memberId);
    const status = paymentStatusMap.get(key) ?? "Unpaid";
    const paid = paymentMap.get(key) ?? 0n;
    const fee = member.monthlyFee;

    totalCollected += paid;
    if (status === "Paid") paidCount++;
    else if (status === "Partial") {
      partialCount++;
      totalPending += fee - paid;
    } else {
      unpaidCount++;
      totalPending += fee;
    }
  }

  const chartData = [
    { name: "Paid", count: paidCount, color: "#00A859" },
    { name: "Partial", count: partialCount, color: "#D4AF37" },
    { name: "Unpaid", count: unpaidCount, color: "#ef4444" },
  ];

  const loading = membersLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: "rgba(212, 175, 55, 1)" }}
          >
            Dashboard
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm">
            Overview for {MONTHS[month - 1]} {year}
          </p>
        </div>

        {/* Month/Year filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: "#D4AF37" }} />
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger
              data-ocid="dashboard.month.select"
              className="w-36 bg-white/90"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger
              data-ocid="dashboard.year.select"
              className="w-28 bg-white/90"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          loading={loading}
          icon={<Users className="w-5 h-5" style={{ color: "#00A859" }} />}
          label="Total Members"
          value={String(totalMembers)}
          accentColor="#00A859"
          data-ocid="dashboard.members.card"
        />
        <StatCard
          loading={loading}
          icon={<TrendingUp className="w-5 h-5" style={{ color: "#D4AF37" }} />}
          label="Collected This Month"
          value={`₹${Number(totalCollected).toLocaleString()}`}
          accentColor="#D4AF37"
          data-ocid="dashboard.collected.card"
        />
        <StatCard
          loading={loading}
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="Pending Dues"
          value={`₹${Number(totalPending).toLocaleString()}`}
          accentColor="#ef4444"
          data-ocid="dashboard.pending.card"
        />
      </div>

      {/* Chart */}
      <Card
        data-ocid="dashboard.chart_point"
        style={{
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
        }}
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Payment Status — {MONTHS[month - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : totalMembers === 0 ? (
            <div
              data-ocid="dashboard.empty_state"
              className="h-48 flex flex-col items-center justify-center text-muted-foreground"
            >
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">
                No members yet. Add members to see stats.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v} members`, "Count"]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      {!loading && totalMembers > 0 && (
        <Card
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-2xl font-bold text-green-700">{paidCount}</p>
                <p className="text-xs text-green-600 font-medium mt-1">Paid</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                <p className="text-2xl font-bold text-yellow-700">
                  {partialCount}
                </p>
                <p className="text-xs text-yellow-600 font-medium mt-1">
                  Partial
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <p className="text-2xl font-bold text-red-700">{unpaidCount}</p>
                <p className="text-xs text-red-600 font-medium mt-1">Unpaid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  loading,
  icon,
  label,
  value,
  accentColor,
  "data-ocid": ocid,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  "data-ocid"?: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="rounded-xl shadow-sm p-6 flex flex-col gap-2"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}
