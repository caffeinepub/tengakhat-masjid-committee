import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentRecord {
    month: bigint;
    note: string;
    year: bigint;
    timestamp: bigint;
    amount: bigint;
}
export interface Member {
    pin: string;
    username: string;
    balance: bigint;
    name: string;
    serialNumber: bigint;
    phone: string;
    monthlyContribution: bigint;
}
export interface Admin {
    username: string;
    role: string;
}
export interface UserProfile {
    userType: string;
    adminInfo?: Admin;
    memberInfo?: Member;
}
export interface UpiSettings {
    upiId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAdmin(principal: Principal, username: string, role: string): Promise<void>;
    addMember(memberPrincipal: Principal, username: string, pin: string, name: string, phone: string, monthlyContribution: bigint, balance: bigint): Promise<void>;
    addPaymentRecord(memberPrincipal: Principal, amount: bigint, month: bigint, year: bigint, note: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMember(memberPrincipal: Principal): Promise<void>;
    getAdmin(principal: Principal): Promise<Admin | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMember(): Promise<Member | null>;
    getMemberByPrincipal(memberPrincipal: Principal): Promise<Member | null>;
    getPayments(): Promise<Array<PaymentRecord>>;
    getPaymentsByMember(memberPrincipal: Principal): Promise<Array<PaymentRecord>>;
    getUpiSettings(): Promise<UpiSettings | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAdmins(): Promise<Array<[Principal, Admin]>>;
    listMembers(): Promise<Array<[Principal, Member]>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMember(memberPrincipal: Principal, username: string, name: string, phone: string, monthlyContribution: bigint, balance: bigint): Promise<void>;
    updatePin(newPin: string): Promise<void>;
    updateUpiSettings(upiId: string): Promise<void>;
}
