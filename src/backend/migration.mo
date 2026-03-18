import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text; phone : Text }>;
    members : Map.Map<Text, {
      serial_no : Nat;
      name : Text;
      phone : Text;
      monthly_amount : Nat;
      join_date : Int;
      status : { #active; #inactive };
    }>;
    payments : Map.Map<Nat, {
      id : Nat;
      member_phone : Text;
      amount : Nat;
      date : Int;
      upi_txn_id : ?Text;
      note : ?Text;
    }>;
    activityLogs : Map.Map<Nat, {
      id : Nat;
      timestamp : Int;
      action : Text;
      details : Text;
      performed_by : Principal;
    }>;
    upiConfig : ?{
      upi_id : Text;
      merchant_name : Text;
      description : Text;
    };
    nextSerialNo : Nat;
    nextPaymentId : Nat;
    nextLogId : Nat;
  };

  type Member = {
    serialNumber : Nat;
    username : Text;
    pin : Text;
    name : Text;
    phone : Text;
    monthlyContribution : Nat;
    balance : Int;
  };

  type Admin = {
    username : Text;
    role : Text;
  };

  type PaymentRecord = {
    amount : Nat;
    month : Nat;
    year : Nat;
    note : Text;
    timestamp : Int;
  };

  type NewActor = {
    members : Map.Map<Principal, Member>;
    admins : Map.Map<Principal, Admin>;
    payments : Map.Map<Principal, [PaymentRecord]>;
    upiSettings : ?{
      upiId : Text;
    };
  };

  public func run(_ : OldActor) : NewActor {
    {
      members = Map.empty<Principal, Member>();
      admins = Map.empty<Principal, Admin>();
      payments = Map.empty<Principal, [PaymentRecord]>();
      upiSettings = null;
    };
  };
};
