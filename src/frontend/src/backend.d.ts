import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ActivityLog {
    id: bigint;
    action: string;
    performed_by: Principal;
    timestamp: bigint;
    details: string;
}
export interface UPIConfig {
    description: string;
    upi_id: string;
    merchant_name: string;
}
export interface Member {
    status: Variant_active_inactive;
    join_date: bigint;
    monthly_amount: bigint;
    name: string;
    phone: string;
    serial_no: bigint;
}
export interface Payment {
    id: bigint;
    date: bigint;
    note?: string;
    member_phone: string;
    upi_txn_id?: string;
    amount: bigint;
}
export interface MonthlyCollection {
    month: string;
    year: bigint;
    amount: bigint;
}
export interface DashboardStats {
    total_collected_this_year: bigint;
    total_collected_this_month: bigint;
    total_members: bigint;
    total_outstanding_balance: bigint;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_inactive {
    active = "active",
    inactive = "inactive"
}
export interface backendInterface {
    addMember(name: string, phone: string, monthly_amount: bigint, join_date: bigint): Promise<Member>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMember(phone: string): Promise<void>;
    getActivityLog(): Promise<Array<ActivityLog>>;
    getAllPayments(): Promise<Array<Payment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getMemberByPhone(phone: string): Promise<Member | null>;
    getMonthlyBalance(member_phone: string, year: bigint, month: bigint): Promise<bigint>;
    getMonthlyCollectionData(): Promise<Array<MonthlyCollection>>;
    getPaymentHistory(member_phone: string): Promise<Array<Payment>>;
    getUPIConfig(): Promise<UPIConfig | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getYearlyBalance(member_phone: string, year: bigint): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    listAllMembers(): Promise<Array<Member>>;
    recordPayment(member_phone: string, amount: bigint, date: bigint, upi_txn_id: string | null, note: string | null): Promise<Payment>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setUPIConfig(upi_id: string, merchant_name: string, description: string): Promise<void>;
    updateMember(phone: string, name: string, monthly_amount: bigint, status: Variant_active_inactive): Promise<Member>;
}
