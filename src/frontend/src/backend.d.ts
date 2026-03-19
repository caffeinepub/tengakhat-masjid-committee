import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stats {
    totalCollected: bigint;
    totalMembers: bigint;
}
export interface Member {
    memberId: bigint;
    name: string;
    address: string;
    phone: string;
    monthlyFee: bigint;
}
export interface Payment {
    status: string;
    memberId: bigint;
    month: bigint;
    year: bigint;
    amountPaid: bigint;
    paymentId: bigint;
    paymentDate: bigint;
    paymentMode: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMember(name: string, phone: string, address: string, monthlyFee: bigint): Promise<bigint>;
    addPayment(memberId: bigint, month: bigint, year: bigint, amountPaid: bigint, status: string, paymentMode: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMember(memberId: bigint): Promise<boolean>;
    deletePayment(paymentId: bigint): Promise<boolean>;
    getAllMembers(): Promise<Array<Member>>;
    getAllPayments(): Promise<Array<Payment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMember(memberId: bigint): Promise<Member | null>;
    getPayment(paymentId: bigint): Promise<Payment | null>;
    getPaymentsByMember(memberId: bigint): Promise<Array<Payment>>;
    getPaymentsByMonthYear(month: bigint, year: bigint): Promise<Array<Payment>>;
    getStats(): Promise<Stats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMember(memberId: bigint, name: string, phone: string, address: string, monthlyFee: bigint): Promise<boolean>;
    updatePayment(paymentId: bigint, month: bigint, year: bigint, amountPaid: bigint, status: string, paymentMode: string): Promise<boolean>;
}
