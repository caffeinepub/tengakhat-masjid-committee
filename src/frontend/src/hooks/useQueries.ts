import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActor } from "../actor";
import type { Member, Payment } from "../backend";

// ── Members ──────────────────────────────────────────────────────────────────

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getAllMembers();
    },
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      address: string;
      monthlyFee: number;
    }) => {
      const actor = await getActor();
      return actor.addMember(
        data.name,
        data.phone,
        data.address,
        BigInt(data.monthlyFee),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      memberId: bigint;
      name: string;
      phone: string;
      address: string;
      monthlyFee: number;
    }) => {
      const actor = await getActor();
      return actor.updateMember(
        data.memberId,
        data.name,
        data.phone,
        data.address,
        BigInt(data.monthlyFee),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: bigint) => {
      const actor = await getActor();
      return actor.deleteMember(memberId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

export function useAllPayments() {
  return useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getAllPayments();
    },
  });
}

export function usePaymentsByMonthYear(month: number, year: number) {
  return useQuery<Payment[]>({
    queryKey: ["payments", month, year],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getPaymentsByMonthYear(BigInt(month), BigInt(year));
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      memberId: bigint;
      month: number;
      year: number;
      amountPaid: number;
      status: string;
      paymentMode: string;
    }) => {
      const actor = await getActor();
      return actor.addPayment(
        data.memberId,
        BigInt(data.month),
        BigInt(data.year),
        BigInt(data.amountPaid),
        data.status,
        data.paymentMode,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      paymentId: bigint;
      month: number;
      year: number;
      amountPaid: number;
      status: string;
      paymentMode: string;
    }) => {
      const actor = await getActor();
      return actor.updatePayment(
        data.paymentId,
        BigInt(data.month),
        BigInt(data.year),
        BigInt(data.amountPaid),
        data.status,
        data.paymentMode,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: bigint) => {
      const actor = await getActor();
      return actor.deletePayment(paymentId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getStats();
    },
  });
}
