import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useActor } from "./hooks/useActor";
import type { Member } from "./hooks/useQueries";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import MemberDashboard from "./pages/MemberDashboard";

type View = "login" | "admin" | "member";

export default function App() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("login");
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  const handleAdminLoginSuccess = () => {
    setView("admin");
  };

  const handleMemberLogin = async (username: string, pin: string) => {
    if (!actor) {
      setMemberError("App is still loading. Please try again.");
      return;
    }
    setIsMemberLoading(true);
    setMemberError(null);
    try {
      const allMembers = await actor.listMembers();
      const found = allMembers.find(
        ([, m]) =>
          m.username.toLowerCase() === username.toLowerCase() && m.pin === pin,
      );
      if (found) {
        setMemberData(found[1]);
        setView("member");
      } else {
        setMemberError("Incorrect username or PIN. Please try again.");
      }
    } catch {
      setMemberError("Login failed. Please try again.");
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleLogout = () => {
    queryClient.clear();
    setView("login");
    setMemberData(null);
    setMemberError(null);
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      {view === "login" && (
        <LoginPage
          onAdminLogin={handleAdminLoginSuccess}
          onMemberLogin={handleMemberLogin}
          isMemberLoading={isMemberLoading}
          memberError={memberError}
        />
      )}
      {view === "admin" && <AdminDashboard onLogout={handleLogout} />}
      {view === "member" && memberData && (
        <MemberDashboard member={memberData} onLogout={handleLogout} />
      )}
    </>
  );
}
