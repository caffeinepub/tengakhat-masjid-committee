import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import LandingPage from "./pages/LandingPage";
import MemberDashboard from "./pages/MemberDashboard";

type View = "landing" | "admin" | "member";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [view, setView] = useState<View>("landing");

  const { data: isAdmin, isLoading: isCheckingRole } = useQuery({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  useEffect(() => {
    if (!identity) {
      setView("landing");
    } else if (isAdmin !== undefined) {
      setView(isAdmin ? "admin" : "member");
    }
  }, [identity, isAdmin]);

  const isLoading =
    isInitializing || (!!identity && (isFetching || isCheckingRole));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center navy-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/70 font-poppins">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {view === "landing" && <LandingPage />}
      {view === "admin" && (
        <AdminDashboard onLogout={() => setView("landing")} />
      )}
      {view === "member" && (
        <MemberDashboard onLogout={() => setView("landing")} />
      )}
    </>
  );
}
