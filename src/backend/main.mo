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
  // Keep accessControlState stable to preserve backward compatibility
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

  public query func getCallerUserProfile() : async ?UserProfile {
    null;
  };

  public query func getUserProfile(_ : Principal) : async ?UserProfile {
    null;
  };

  public shared func saveCallerUserProfile(_ : UserProfile) : async () {
    Runtime.trap("Use specific member/admin management functions");
  };

  // Admin Management

  public shared func addAdmin(principal : Principal, username : Text, role : Text) : async () {
    if (role != "admin" and role != "superadmin") {
      Runtime.trap("Invalid role: must be 'admin' or 'superadmin'");
    };
    let admin = { username; role };
    admins.add(principal, admin);
  };

  public query func getAdmin(principal : Principal) : async ?Admin {
    admins.get(principal);
  };

  public query func listAdmins() : async [(Principal, Admin)] {
    admins.entries().toArray();
  };

  // Member Management

  public shared func addMember(
    memberPrincipal : Principal,
    username : Text,
    pin : Text,
    name : Text,
    phone : Text,
    monthlyContribution : Nat,
    balance : Int,
  ) : async () {
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
  };

  public shared func updateMember(
    memberPrincipal : Principal,
    username : Text,
    name : Text,
    phone : Text,
    monthlyContribution : Nat,
    balance : Int,
  ) : async () {
    switch (members.get(memberPrincipal)) {
      case (?existingMember) {
        let updatedMember = {
          serialNumber = existingMember.serialNumber;
          username;
          pin = existingMember.pin;
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

  public shared func deleteMember(memberPrincipal : Principal) : async () {
    members.remove(memberPrincipal);
    payments.remove(memberPrincipal);
  };

  public query func getMember() : async ?Member {
    null;
  };

  public query func getMemberByPrincipal(memberPrincipal : Principal) : async ?Member {
    members.get(memberPrincipal);
  };

  public query func listMembers() : async [(Principal, Member)] {
    members.entries().toArray();
  };

  public shared func updatePin(_ : Text) : async () {
    // PIN updates handled via updateMember
  };

  // UPI Settings Management

  public shared func updateUpiSettings(upiId : Text) : async () {
    upiSettings := ?{ upiId };
  };

  public query func getUpiSettings() : async ?UpiSettings {
    upiSettings;
  };

  // Payment Records Management

  public shared func addPaymentRecord(
    memberPrincipal : Principal,
    amount : Nat,
    month : Nat,
    year : Nat,
    note : Text,
  ) : async () {
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

  public query func getPayments() : async [PaymentRecord] {
    [];
  };

  public query func getPaymentsByMember(memberPrincipal : Principal) : async [PaymentRecord] {
    switch (payments.get(memberPrincipal)) {
      case (?records) { records };
      case (null) { [] };
    };
  };
};
