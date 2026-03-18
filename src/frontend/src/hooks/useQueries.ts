import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Admin,
  Member,
  PaymentRecord,
  UpiSettings,
  UserProfile,
} from "../backend.d.ts";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { Admin, Member, PaymentRecord, UpiSettings, UserProfile };

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
  return useQuery<Array<[Principal, Member]>>({
    queryKey: ["members"],
    queryFn: () => actor!.listMembers(),
    enabled,
  });
}

export function useGetMember() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Member | null>({
    queryKey: ["myMember"],
    queryFn: () => actor!.getMember(),
    enabled,
  });
}

export function useUpiSettings() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<UpiSettings | null>({
    queryKey: ["upiSettings"],
    queryFn: () => actor!.getUpiSettings(),
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

export function useAdmins() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Array<[Principal, Admin]>>({
    queryKey: ["admins"],
    queryFn: () => actor!.listAdmins(),
    enabled,
  });
}

export function usePaymentsByMember(memberPrincipal: Principal | null) {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Array<PaymentRecord>>({
    queryKey: ["payments", memberPrincipal?.toString()],
    queryFn: () => actor!.getPaymentsByMember(memberPrincipal!),
    enabled: enabled && memberPrincipal != null,
  });
}

export function useMyPayments() {
  const { actor, enabled } = useActorEnabled();
  return useQuery<Array<PaymentRecord>>({
    queryKey: ["myPayments"],
    queryFn: () => actor!.getPayments(),
    enabled,
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      principal: Principal;
      username: string;
      pin: string;
      name: string;
      phone: string;
      monthlyContribution: bigint;
    }) =>
      actor!.addMember(
        data.principal,
        data.username,
        data.pin,
        data.name,
        data.phone,
        data.monthlyContribution,
        BigInt(0),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (principal: Principal) => actor!.deleteMember(principal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateUpiSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (upiId: string) => actor!.updateUpiSettings(upiId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["upiSettings"] }),
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      memberPrincipal: Principal;
      amount: bigint;
      month: bigint;
      year: bigint;
      note: string;
    }) =>
      actor!.addPaymentRecord(
        data.memberPrincipal,
        data.amount,
        data.month,
        data.year,
        data.note,
      ),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({
          queryKey: ["payments", variables.memberPrincipal.toString()],
        }),
      ]),
  });
}

export function useAddAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      principal: Principal;
      username: string;
      role: string;
    }) => actor!.addAdmin(data.principal, data.username, data.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admins"] }),
  });
}
