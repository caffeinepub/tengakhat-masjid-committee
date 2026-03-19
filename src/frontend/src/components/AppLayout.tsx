import { Button } from "@/components/ui/button";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import DashboardPage from "../pages/DashboardPage";
import MembersPage from "../pages/MembersPage";
import PaymentsPage from "../pages/PaymentsPage";
import ReportsTab from "../pages/ReportsTab";
import SettingsPage from "../pages/SettingsPage";

type Tab = "dashboard" | "members" | "payments" | "reports" | "settings";

interface Props {
  onLogout: () => void;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
  {
    id: "payments",
    label: "Payments",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

export default function AppLayout({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(tab: Tab) {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="app-header text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/tmc-logo-v2.dim_700x200.png"
                alt="Tengakhat Masjid Committee"
                className="h-20 w-auto object-contain"
              />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  data-ocid={`nav.${tab.id}.link`}
                  onClick={() => navigate(tab.id)}
                  className={`nav-tab ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                data-ocid="nav.logout.button"
                onClick={onLogout}
                className="ml-2 text-white hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
              data-ocid="nav.menu.button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10"
              style={{ background: "rgba(0, 70, 35, 0.97)" }}
            >
              <div className="px-4 py-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    data-ocid={`nav.mobile.${tab.id}.link`}
                    onClick={() => navigate(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  data-ocid="nav.mobile.logout.button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "dashboard" && <DashboardPage />}
          {activeTab === "members" && <MembersPage />}
          {activeTab === "payments" && <PaymentsPage />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "settings" && <SettingsPage />}
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs"
        style={{
          borderColor: "rgba(212, 175, 55, 0.3)",
          background: "rgba(0, 0, 0, 0.3)",
          color: "rgba(212, 175, 55, 0.9)",
        }}
      >
        © {new Date().getFullYear()} Tengakhat Masjid Committee. Built with ❤️
        using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
