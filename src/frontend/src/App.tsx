import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";

const SESSION_KEY = "tmc_admin_session";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === "true";
  });

  useEffect(() => {
    const check = () => {
      setIsLoggedIn(localStorage.getItem(SESSION_KEY) === "true");
    };
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  function handleLogin() {
    localStorage.setItem(SESSION_KEY, "true");
    setIsLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      {isLoggedIn ? (
        <AppLayout onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
}
