import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Member Type
  type Member = {
    serialNumber : Nat;
    username : Text;
    pin : Text;
    name : Text;
    phone : Text;
    monthlyContribution : Nat;
    balance : Int;
  };

  // Admin Type
  type Admin = {
    username : Text;
    role : Text; // "superadmin" or "admin"
  };

  // Payment Record Type
  type PaymentRecord = {
    amount : Nat;
    month : Nat;
    year : Nat;
    note : Text;
    timestamp : Int;
  };

  // UPI Settings Type
  type UpiSettings = {
    upiId : Text;
  };

  // User Profile Type (required by frontend)
  public type UserProfile = {
    userType : Text; // "admin" or "member"
    adminInfo : ?Admin;
    memberInfo : ?Member;
  };

  let members = Map.empty<Principal, Member>();
  let admins = Map.empty<Principal, Admin>();
  let payments = Map.empty<Principal, [PaymentRecord]>();
  var upiSettings : ?UpiSettings = null;

  // Required profile management functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };

    // Check if admin
    switch (admins.get(caller)) {
      case (?admin) {
        return ?{
          userType = "admin";
          adminInfo = ?admin;
          memberInfo = null;
        };
      };
      case (null) {};
    };

    // Check if member
    switch (members.get(caller)) {
      case (?member) {
        return ?{
          userType = "member";
          adminInfo = null;
          memberInfo = ?member;
        };
      };
      case (null) {};
    };

    null;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Only admins can view other users' profiles
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    // Check if admin
    switch (admins.get(user)) {
      case (?admin) {
        return ?{
          userType = "admin";
          adminInfo = ?admin;
          memberInfo = null;
        };
      };
      case (null) {};
    };

    // Check if member
    switch (members.get(user)) {
      case (?member) {
        return ?{
          userType = "member";
          adminInfo = null;
          memberInfo = ?member;
        };
      };
      case (null) {};
    };

    null;
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // This is a placeholder - in this app, profiles are managed through
    // specific functions (addMember, updatePin, etc.)
    Runtime.trap("Use specific member/admin management functions");
  };

  // Admin Management

  public shared ({ caller }) func addAdmin(principal : Principal, username : Text, role : Text) : async () {
    // Only admins can add other admins
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add other admins");
    };

    // Validate role
    if (role != "admin" and role != "superadmin") {
      Runtime.trap("Invalid role: must be 'admin' or 'superadmin'");
    };

    let admin = { username; role };
    admins.add(principal, admin);

    // Assign admin role in access control system
    AccessControl.assignRole(accessControlState, caller, principal, #admin);
  };

  public query ({ caller }) func getAdmin(principal : Principal) : async ?Admin {
    // Only admins can view admin info
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view admin information");
    };

    admins.get(principal);
  };

  public query ({ caller }) func listAdmins() : async [(Principal, Admin)] {
    // Only admins can list admins
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can list admins");
    };

    admins.entries().toArray();
  };

  // Member Management

  public shared ({ caller }) func addMember(
    memberPrincipal : Principal,
    username : Text,
    pin : Text,
    name : Text,
    phone : Text,
    monthlyContribution : Nat,
    balance : Int,
  ) : async () {
    // Only admins can add members
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add members");
    };

    let member = {
      serialNumber = members.size() + 1;
      username;
      pin;
      name;
      phone;
      monthlyContribution;
      balance;
    };
    members.add(memberPrincipal, member);

    // Assign user role in access control system
    AccessControl.assignRole(accessControlState, caller, memberPrincipal, #user);
  };

  public shared ({ caller }) func updateMember(
    memberPrincipal : Principal,
    username : Text,
    name : Text,
    phone : Text,
    monthlyContribution : Nat,
    balance : Int,
  ) : async () {
    // Only admins can update members
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update members");
    };

    switch (members.get(memberPrincipal)) {
      case (?existingMember) {
        let updatedMember = {
          serialNumber = existingMember.serialNumber;
          username;
          pin = existingMember.pin; // Keep existing PIN
          name;
          phone;
          monthlyContribution;
          balance;
        };
        members.add(memberPrincipal, updatedMember);
      };
      case (null) {
        Runtime.trap("Member not found");
      };
    };
  };

  public shared ({ caller }) func deleteMember(memberPrincipal : Principal) : async () {
    // Only admins can delete members
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };

    members.remove(memberPrincipal);
    payments.remove(memberPrincipal);
  };

  public query ({ caller }) func getMember() : async ?Member {
    // Members can view their own profile
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only members can view their profile");
    };

    members.get(caller);
  };

  public query ({ caller }) func getMemberByPrincipal(memberPrincipal : Principal) : async ?Member {
    // Only admins can view other members' profiles
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view member profiles");
    };

    members.get(memberPrincipal);
  };

  public query ({ caller }) func listMembers() : async [(Principal, Member)] {
    // Only admins can list all members
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can list members");
    };

    members.entries().toArray();
  };

  public shared ({ caller }) func updatePin(newPin : Text) : async () {
    // Members can update their own PIN
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only members can update their PIN");
    };

    switch (members.get(caller)) {
      case (?member) {
        let updatedMember = { member with pin = newPin };
        members.add(caller, updatedMember);
      };
      case (null) {
        Runtime.trap("Member not found");
      };
    };
  };

  // UPI Settings Management

  public shared ({ caller }) func updateUpiSettings(upiId : Text) : async () {
    // Only admins can update UPI settings
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update UPI settings");
    };

    upiSettings := ?{ upiId };
  };

  public query ({ caller }) func getUpiSettings() : async ?UpiSettings {
    // Only authenticated users can view UPI settings
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view UPI settings");
    };

    upiSettings;
  };

  // Payment Records Management

  public shared ({ caller }) func addPaymentRecord(
    memberPrincipal : Principal,
    amount : Nat,
    month : Nat,
    year : Nat,
    note : Text,
  ) : async () {
    // Only admins can add payment records
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add payment records");
    };

    // Verify member exists
    switch (members.get(memberPrincipal)) {
      case (null) {
        Runtime.trap("Member not found");
      };
      case (?_) {};
    };

    let paymentRecord = {
      amount;
      month;
      year;
      note;
      timestamp = Time.now();
    };

    switch (payments.get(memberPrincipal)) {
      case (?existingPayments) {
        let newPayments = existingPayments.concat([paymentRecord]);
        payments.add(memberPrincipal, newPayments);
      };
      case (null) {
        payments.add(memberPrincipal, [paymentRecord]);
      };
    };
  };

  public query ({ caller }) func getPayments() : async [PaymentRecord] {
    // Members can view their own payment records
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only members can view their payments");
    };

    switch (payments.get(caller)) {
      case (?records) { records };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getPaymentsByMember(memberPrincipal : Principal) : async [PaymentRecord] {
    // Only admins can view other members' payment records
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view member payment records");
    };

    switch (payments.get(memberPrincipal)) {
      case (?records) { records };
      case (null) { [] };
    };
  };
};
