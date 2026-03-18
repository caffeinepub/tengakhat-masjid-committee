import { Toaster } from "@/components/ui/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import type { Member } from "./hooks/useQueries";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import MemberDashboard from "./pages/MemberDashboard";

type View = "login" | "admin" | "member";

export default function App() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("login");
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [pendingRole, setPendingRole] = useState<"member" | null>(null);

  const isActorReady = !!actor && !isFetching && !!identity;

  const { data: memberProfile, isLoading: checkingMember } = useQuery({
    queryKey: ["myMember", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getMember(),
    enabled: isActorReady && pendingRole === "member",
  });

  useEffect(() => {
    if (!identity && view !== "admin") {
      setView("login");
      setMemberData(null);
      setPendingRole(null);
    }
  }, [identity, view]);

  const handleAdminLoginSuccess = () => {
    setView("admin");
  };

  const handleMemberLoginSuccess = () => {
    setPendingRole("member");
  };

  // When member verification completes
  useEffect(() => {
    if (pendingRole === "member" && memberProfile !== undefined) {
      if (memberProfile !== null) {
        setMemberData(memberProfile);
        setView("member");
      } else {
        setPendingRole(null);
      }
    }
  }, [pendingRole, memberProfile]);

  const handleLogout = () => {
    clear();
    queryClient.clear();
    setView("login");
    setMemberData(null);
    setPendingRole(null);
  };

  const isVerifying =
    !!identity && (isFetching || (pendingRole === "member" && checkingMember));

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center navy-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/70 font-poppins">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {view === "login" && (
        <LoginPage
          onAdminLogin={handleAdminLoginSuccess}
          onMemberLogin={handleMemberLoginSuccess}
          isVerifying={isVerifying}
          memberData={memberProfile ?? null}
          pendingRole={pendingRole}
          onCancelVerify={() => {
            clear();
            queryClient.clear();
            setPendingRole(null);
          }}
        />
      )}
      {view === "admin" && <AdminDashboard onLogout={handleLogout} />}
      {view === "member" && memberData && (
        <MemberDashboard member={memberData} onLogout={handleLogout} />
      )}
    </>
  );
}
