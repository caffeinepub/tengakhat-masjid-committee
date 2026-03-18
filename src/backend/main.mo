import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    phone : Text;
  };

  // Member Type
  public type Member = {
    serial_no : Nat;
    name : Text;
    phone : Text;
    monthly_amount : Nat;
    join_date : Int;
    status : { #active; #inactive };
  };

  // Payment Type
  public type Payment = {
    id : Nat;
    member_phone : Text;
    amount : Nat;
    date : Int;
    upi_txn_id : ?Text;
    note : ?Text;
  };

  // UPI Configuration Type
  public type UPIConfig = {
    upi_id : Text;
    merchant_name : Text;
    description : Text;
  };

  // Activity Log Type
  public type ActivityLog = {
    id : Nat;
    timestamp : Int;
    action : Text;
    details : Text;
    performed_by : Principal;
  };

  // Dashboard Stats Type
  public type DashboardStats = {
    total_members : Nat;
    total_collected_this_month : Nat;
    total_collected_this_year : Nat;
    total_outstanding_balance : Nat;
  };

  // Monthly Collection Data Type
  public type MonthlyCollection = {
    month : Text;
    year : Nat;
    amount : Nat;
  };

  // State variables
  let userProfiles = Map.empty<Principal, UserProfile>();
  let members = Map.empty<Text, Member>(); // phone -> Member
  let payments = Map.empty<Nat, Payment>(); // payment_id -> Payment
  let activityLogs = Map.empty<Nat, ActivityLog>(); // log_id -> ActivityLog
  var upiConfig : ?UPIConfig = null;
  var nextSerialNo : Nat = 1;
  var nextPaymentId : Nat = 1;
  var nextLogId : Nat = 1;

  // Helper function to add activity log
  private func addActivityLog(action : Text, details : Text, caller : Principal) {
    let log : ActivityLog = {
      id = nextLogId;
      timestamp = Time.now();
      action = action;
      details = details;
      performed_by = caller;
    };
    activityLogs.add(nextLogId, log);
    nextLogId += 1;
  };

  // ===== User Profile Management =====

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ===== Member Management =====

  public shared ({ caller }) func addMember(
    name : Text,
    phone : Text,
    monthly_amount : Nat,
    join_date : Int,
  ) : async Member {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add members");
    };

    // Check if phone already exists
    switch (members.get(phone)) {
      case (?_) {
        Runtime.trap("Member with this phone number already exists");
      };
      case null {
        let member : Member = {
          serial_no = nextSerialNo;
          name = name;
          phone = phone;
          monthly_amount = monthly_amount;
          join_date = join_date;
          status = #active;
        };
        members.add(phone, member);
        nextSerialNo += 1;

        addActivityLog("member_added", "Added member: " # name # " (" # phone # ")", caller);
        member;
      };
    };
  };

  public shared ({ caller }) func deleteMember(phone : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };

    switch (members.get(phone)) {
      case (?member) {
        members.remove(phone);
        addActivityLog("member_deleted", "Deleted member: " # member.name # " (" # phone # ")", caller);
      };
      case null {
        Runtime.trap("Member not found");
      };
    };
  };

  public shared ({ caller }) func updateMember(
    phone : Text,
    name : Text,
    monthly_amount : Nat,
    status : { #active; #inactive },
  ) : async Member {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update members");
    };

    switch (members.get(phone)) {
      case (?member) {
        let updatedMember : Member = {
          serial_no = member.serial_no;
          name = name;
          phone = phone;
          monthly_amount = monthly_amount;
          join_date = member.join_date;
          status = status;
        };
        members.add(phone, updatedMember);
        updatedMember;
      };
      case null {
        Runtime.trap("Member not found");
      };
    };
  };

  public query ({ caller }) func listAllMembers() : async [Member] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all members");
    };

    members.values().toArray();
  };

  public query ({ caller }) func getMemberByPhone(phone : Text) : async ?Member {
    // Members can view their own profile, admins can view any
    let profile = userProfiles.get(caller);
    let isOwnProfile = switch (profile) {
      case (?p) { p.phone == phone };
      case null { false };
    };

    if (not isOwnProfile and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own member profile");
    };

    members.get(phone);
  };

  // ===== Payment Management =====

  public shared ({ caller }) func recordPayment(
    member_phone : Text,
    amount : Nat,
    date : Int,
    upi_txn_id : ?Text,
    note : ?Text,
  ) : async Payment {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can record payments");
    };

    // Verify member exists
    switch (members.get(member_phone)) {
      case null {
        Runtime.trap("Member not found");
      };
      case (?_) {
        let payment : Payment = {
          id = nextPaymentId;
          member_phone = member_phone;
          amount = amount;
          date = date;
          upi_txn_id = upi_txn_id;
          note = note;
        };
        payments.add(nextPaymentId, payment);
        nextPaymentId += 1;

        addActivityLog("payment_recorded", "Payment of ₹" # amount.toText() # " recorded for " # member_phone, caller);
        payment;
      };
    };
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all payments");
    };

    payments.values().toArray();
  };

  public query ({ caller }) func getPaymentHistory(member_phone : Text) : async [Payment] {
    // Members can view their own payment history, admins can view any
    let profile = userProfiles.get(caller);
    let isOwnProfile = switch (profile) {
      case (?p) { p.phone == member_phone };
      case null { false };
    };

    if (not isOwnProfile and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own payment history");
    };

    let allPayments = payments.values().toArray();
    allPayments.filter(func(p : Payment) : Bool { p.member_phone == member_phone });
  };

  public query ({ caller }) func getYearlyBalance(member_phone : Text, year : Nat) : async Int {
    // Members can view their own balance, admins can view any
    let profile = userProfiles.get(caller);
    let isOwnProfile = switch (profile) {
      case (?p) { p.phone == member_phone };
      case null { false };
    };

    if (not isOwnProfile and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };

    switch (members.get(member_phone)) {
      case null { Runtime.trap("Member not found") };
      case (?member) {
        let yearlyTarget = member.monthly_amount * 12;
        let allPayments = payments.values().toArray();
        let yearPayments = allPayments.filter(func(p : Payment) : Bool {
          p.member_phone == member_phone and isInYear(p.date, year)
        });
        let totalPaid = yearPayments.foldLeft(0, func(acc : Nat, p : Payment) : Nat {
          acc + p.amount
        });
        yearlyTarget - totalPaid;
      };
    };
  };

  public query ({ caller }) func getMonthlyBalance(member_phone : Text, year : Nat, month : Nat) : async Int {
    // Members can view their own balance, admins can view any
    let profile = userProfiles.get(caller);
    let isOwnProfile = switch (profile) {
      case (?p) { p.phone == member_phone };
      case null { false };
    };

    if (not isOwnProfile and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };

    switch (members.get(member_phone)) {
      case null { Runtime.trap("Member not found") };
      case (?member) {
        let monthlyTarget = member.monthly_amount;
        let allPayments = payments.values().toArray();
        let monthPayments = allPayments.filter(func(p : Payment) : Bool {
          p.member_phone == member_phone and isInMonth(p.date, year, month)
        });
        let totalPaid = monthPayments.foldLeft(0, func(acc : Nat, p : Payment) : Nat {
          acc + p.amount
        });
        monthlyTarget - totalPaid;
      };
    };
  };

  // Helper functions for date filtering
  private func isInYear(timestamp : Int, year : Nat) : Bool {
    // Simplified: assumes timestamp is in nanoseconds
    // In production, use proper date library
    true // Placeholder
  };

  private func isInMonth(timestamp : Int, year : Nat, month : Nat) : Bool {
    // Simplified: assumes timestamp is in nanoseconds
    // In production, use proper date library
    true // Placeholder
  };

  // ===== UPI Configuration =====

  public shared ({ caller }) func setUPIConfig(
    upi_id : Text,
    merchant_name : Text,
    description : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set UPI configuration");
    };

    upiConfig := ?{
      upi_id = upi_id;
      merchant_name = merchant_name;
      description = description;
    };
  };

  public query func getUPIConfig() : async ?UPIConfig {
    // Public access - anyone can read UPI config to generate payment links
    upiConfig;
  };

  // ===== Activity Log =====

  public query ({ caller }) func getActivityLog() : async [ActivityLog] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view activity log");
    };

    activityLogs.values().toArray();
  };

  // ===== Dashboard Stats =====

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard stats");
    };

    let allMembers = members.values().toArray();
    let activeMembers = allMembers.filter(func(m : Member) : Bool {
      switch (m.status) {
        case (#active) { true };
        case (#inactive) { false };
      };
    });

    let allPayments = payments.values().toArray();
    let now = Time.now();

    // Calculate this month's collections (simplified)
    let thisMonthPayments = allPayments; // Placeholder - filter by current month
    let totalThisMonth = thisMonthPayments.foldLeft(0, func(acc : Nat, p : Payment) : Nat {
      acc + p.amount
    });

    // Calculate this year's collections (simplified)
    let thisYearPayments = allPayments; // Placeholder - filter by current year
    let totalThisYear = thisYearPayments.foldLeft(0, func(acc : Nat, p : Payment) : Nat {
      acc + p.amount
    });

    // Calculate outstanding balance
    let yearlyTarget = activeMembers.foldLeft(0, func(acc : Nat, m : Member) : Nat {
      acc + (m.monthly_amount * 12)
    });
    let outstanding = if (yearlyTarget > totalThisYear) {
      yearlyTarget - totalThisYear;
    } else {
      0;
    };

    {
      total_members = activeMembers.size();
      total_collected_this_month = totalThisMonth;
      total_collected_this_year = totalThisYear;
      total_outstanding_balance = outstanding;
    };
  };

  public query ({ caller }) func getMonthlyCollectionData() : async [MonthlyCollection] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view monthly collection data");
    };

    // Placeholder - return last 12 months of data
    // In production, calculate actual monthly totals
    [];
  };
};
