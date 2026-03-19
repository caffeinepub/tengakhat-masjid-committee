import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import MemberPortal from "./pages/MemberPortal";

const ADMIN_SESSION_KEY = "tmc_admin_session";
const MEMBER_SESSION_KEY = "tmc_member_session";

export default function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });
  const [memberSession, setMemberSession] = useState<string | null>(() => {
    return localStorage.getItem(MEMBER_SESSION_KEY);
  });

  useEffect(() => {
    const check = () => {
      setAdminLoggedIn(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
      setMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
    };
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  function handleAdminLogin() {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    setAdminLoggedIn(true);
  }

  function handleAdminLogout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminLoggedIn(false);
  }

  function handleMemberLogin(memberId: string) {
    localStorage.setItem(MEMBER_SESSION_KEY, memberId);
    setMemberSession(memberId);
  }

  function handleMemberLogout() {
    localStorage.removeItem(MEMBER_SESSION_KEY);
    setMemberSession(null);
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      {adminLoggedIn ? (
        <AppLayout onLogout={handleAdminLogout} />
      ) : memberSession ? (
        <MemberPortal memberId={memberSession} onLogout={handleMemberLogout} />
      ) : (
        <LoginPage
          onAdminLogin={handleAdminLogin}
          onMemberLogin={handleMemberLogin}
        />
      )}
    </>
  );
}
