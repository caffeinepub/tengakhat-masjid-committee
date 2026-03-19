import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Preserved from previous version to satisfy upgrade compatibility.
  // These are no longer used for access control since auth is frontend-only.
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Member Type
  type Member = {
    memberId : Nat;
    name : Text;
    phone : Text;
    address : Text;
    monthlyFee : Nat;
  };

  // Payment Type
  type Payment = {
    paymentId : Nat;
    memberId : Nat;
    month : Nat;
    year : Nat;
    amountPaid : Nat;
    status : Text;
    paymentDate : Int;
    paymentMode : Text;
  };

  type Stats = {
    totalMembers : Nat;
    totalCollected : Nat;
  };

  let members = Map.empty<Nat, Member>();
  let payments = Map.empty<Nat, Payment>();
  var memberCounter = 0;
  var paymentCounter = 0;

  // Member CRUD — no access control checks (auth is handled by the frontend)

  public shared func addMember(name : Text, phone : Text, address : Text, monthlyFee : Nat) : async Nat {
    let memberId = memberCounter + 1;
    let member : Member = { memberId; name; phone; address; monthlyFee };
    members.add(memberId, member);
    memberCounter += 1;
    memberId;
  };

  public query func getMember(memberId : Nat) : async ?Member {
    members.get(memberId);
  };

  public query func getAllMembers() : async [Member] {
    members.values().toArray();
  };

  public shared func updateMember(memberId : Nat, name : Text, phone : Text, address : Text, monthlyFee : Nat) : async Bool {
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found"); };
      case (?_) {};
    };
    members.add(memberId, { memberId; name; phone; address; monthlyFee });
    true;
  };

  public shared func deleteMember(memberId : Nat) : async Bool {
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found"); };
      case (?_) {};
    };
    members.remove(memberId);
    true;
  };

  // Payment CRUD

  public shared func addPayment(memberId : Nat, month : Nat, year : Nat, amountPaid : Nat, status : Text, paymentMode : Text) : async Nat {
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found"); };
      case (?_) {};
    };
    let paymentId = paymentCounter + 1;
    let payment : Payment = {
      paymentId; memberId; month; year; amountPaid; status;
      paymentDate = Time.now(); paymentMode;
    };
    payments.add(paymentId, payment);
    paymentCounter += 1;
    paymentId;
  };

  public query func getPayment(paymentId : Nat) : async ?Payment {
    payments.get(paymentId);
  };

  public query func getAllPayments() : async [Payment] {
    payments.values().toArray();
  };

  public shared func updatePayment(paymentId : Nat, month : Nat, year : Nat, amountPaid : Nat, status : Text, paymentMode : Text) : async Bool {
    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found"); };
      case (?payment) {
        switch (members.get(payment.memberId)) {
          case (null) { Runtime.trap("Member not found for this payment"); };
          case (?_) {};
        };
        payments.add(paymentId, {
          paymentId; memberId = payment.memberId; month; year;
          amountPaid; status; paymentDate = Time.now(); paymentMode;
        });
        true;
      };
    };
  };

  public shared func deletePayment(paymentId : Nat) : async Bool {
    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found"); };
      case (?_) {};
    };
    payments.remove(paymentId);
    true;
  };

  public query func getPaymentsByMember(memberId : Nat) : async [Payment] {
    payments.values().toArray().filter(func(p) { p.memberId == memberId });
  };

  public query func getPaymentsByMonthYear(month : Nat, year : Nat) : async [Payment] {
    payments.values().toArray().filter(func(p) { p.month == month and p.year == year });
  };

  public query func getStats() : async Stats {
    var totalCollected = 0;
    for (payment in payments.values().toArray().values()) {
      totalCollected += payment.amountPaid;
    };
    { totalMembers = members.size(); totalCollected };
  };
};
