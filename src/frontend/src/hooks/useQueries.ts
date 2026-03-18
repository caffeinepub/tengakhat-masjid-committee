import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActivityLog,
  DashboardStats,
  Member,
  MonthlyCollection,
  Payment,
  UPIConfig,
  UserProfile,
} from "../backend.d";
import { Variant_active_inactive } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export { Variant_active_inactive };
export type {
  Member,
  Payment,
  DashboardStats,
  MonthlyCollection,
  UPIConfig,
  ActivityLog,
  UserProfile,
};

function useActorEnabled() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return { actor, enabled: !!actor && !isFetching && !!identity };
}

export function useIsAdmin() {
  const { actor, enabled } = useActorEnabled();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled,
  });
}

export function useMembers() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () => actor!.listAllMembers(),
    enabled,
  });
}

export function useDashboardStats() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled,
  });
}

export function useMonthlyCollection() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<MonthlyCollection[]>({
    queryKey: ["monthlyCollection"],
    queryFn: () => actor!.getMonthlyCollectionData(),
    enabled,
  });
}

export function useAllPayments() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Payment[]>({
    queryKey: ["allPayments"],
    queryFn: () => actor!.getAllPayments(),
    enabled,
  });
}

export function usePaymentHistory(phone: string) {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Payment[]>({
    queryKey: ["paymentHistory", phone],
    queryFn: () => actor!.getPaymentHistory(phone),
    enabled: enabled && !!phone,
  });
}

export function useUPIConfig() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<UPIConfig | null>({
    queryKey: ["upiConfig"],
    queryFn: () => actor!.getUPIConfig(),
    enabled,
  });
}

export function useActivityLog() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<ActivityLog[]>({
    queryKey: ["activityLog"],
    queryFn: () => actor!.getActivityLog(),
    enabled,
  });
}

export function useCallerProfile() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled,
  });
}

export function useMemberByPhone(phone: string) {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Member | null>({
    queryKey: ["memberByPhone", phone],
    queryFn: () => actor!.getMemberByPhone(phone),
    enabled: enabled && !!phone,
  });
}

export function useYearlyBalance(phone: string, year: number) {
  const { actor, enabled } = useActorEnabled();
  return useQuery<bigint>({
    queryKey: ["yearlyBalance", phone, year],
    queryFn: () => actor!.getYearlyBalance(phone, BigInt(year)),
    enabled: enabled && !!phone,
  });
}

// Mutations
export function useAddMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      phone: string;
      monthly_amount: number;
    }) =>
      actor!.addMember(
        data.name,
        data.phone,
        BigInt(data.monthly_amount),
        BigInt(Math.floor(Date.now() / 1000)),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (phone: string) => actor!.deleteMember(phone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      phone: string;
      name: string;
      monthly_amount: number;
      status: Variant_active_inactive;
    }) =>
      actor!.updateMember(
        data.phone,
        data.name,
        BigInt(data.monthly_amount),
        data.status,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useRecordPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      member_phone: string;
      amount: number;
      upi_txn_id?: string;
      note?: string;
    }) =>
      actor!.recordPayment(
        data.member_phone,
        BigInt(data.amount),
        BigInt(Math.floor(Date.now() / 1000)),
        data.upi_txn_id || null,
        data.note || null,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["paymentHistory"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useSetUPIConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      upi_id: string;
      merchant_name: string;
      description: string;
    }) =>
      actor!.setUPIConfig(data.upi_id, data.merchant_name, data.description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["upiConfig"] }),
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => actor!.saveCallerUserProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

// Helpers
export function formatAmount(amount: bigint): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
