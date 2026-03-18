import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  CheckCircle,
  CreditCard,
  Menu,
  Moon,
  Phone,
  Shield,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

const features = [
  {
    icon: Users,
    title: "Member Database",
    description:
      "Manage all committee members with serial numbers, profiles, and contribution details.",
  },
  {
    icon: CreditCard,
    title: "UPI Payments",
    description:
      "Seamless payments via Google Pay, PhonePe, and Paytm with instant confirmation.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Visual dashboards with monthly trends, yearly summaries, and outstanding balances.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Blockchain-backed data storage on Internet Computer for maximum security.",
  },
];

export default function LandingPage() {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const { actor } = useActor();
  const saveProfile = useSaveProfile();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSendOTP = () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setOtpSent(true);
    toast.success(`OTP sent to +91 ${cleaned}`);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setOtpVerified(true);
    toast.success("OTP verified! Connecting to Internet Identity...");
    // Trigger II login
    login();
  };

  // After II login, save phone profile
  const [profileSaved, setProfileSaved] = useState(false);
  if (identity && actor && !profileSaved && phone) {
    setProfileSaved(true);
    const cleaned = phone.replace(/\D/g, "");
    saveProfile.mutate({ phone: cleaned, name: "" });
  }

  return (
    <div className="min-h-screen flex flex-col navy-gradient font-poppins">
      {/* Header */}
      <header className="navy-gradient border-b border-gold/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-gold overflow-hidden flex items-center justify-center">
              <img
                src="/assets/generated/tmc-logo-transparent.dim_200x200.png"
                alt="TMC Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-gold font-bold text-sm leading-tight">
                TENGAKHAT MASJID
              </p>
              <p className="text-gold/80 text-xs font-medium">COMMITTEE</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-white/70 hover:text-gold transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-white/70 hover:text-gold transition-colors text-sm font-medium"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-white/70 hover:text-gold transition-colors text-sm font-medium"
            >
              Contact
            </a>
          </nav>

          {/* Login Button */}
          <div className="flex items-center gap-3">
            <Button
              className="btn-gold hidden md:flex"
              onClick={() =>
                document
                  .getElementById("login-card")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              data-ocid="nav.login_button"
            >
              Sign In / Login
            </Button>
            <button
              type="button"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gold/20"
            >
              <div className="px-4 py-3 flex flex-col gap-3">
                <a
                  href="#features"
                  className="text-white/70 hover:text-gold transition-colors text-sm"
                >
                  Features
                </a>
                <a
                  href="#about"
                  className="text-white/70 hover:text-gold transition-colors text-sm"
                >
                  About
                </a>
                <Button
                  className="btn-gold w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document
                      .getElementById("login-card")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-ocid="nav.primary_button"
                >
                  Sign In
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/assets/generated/mosque-hero.dim_1200x600.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/90 via-navy/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />

        <div className="relative max-w-7xl mx-auto px-4 w-full py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Headline */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="glass-card-navy rounded-2xl p-8 md:p-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Moon size={20} className="text-gold" />
                <span className="text-gold/80 text-sm font-medium tracking-wider uppercase">
                  Islamic Committee Management
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                TENGAKHAT
                <span className="block text-gold">MASJID</span>
                <span className="block text-white/90 text-3xl md:text-4xl">
                  COMMITTEE
                </span>
              </h1>
              <div className="gold-divider my-4" />
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Streamline mosque contributions, manage members, and enable
                seamless UPI payments — all in one beautiful platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="btn-gold px-8 py-3 text-base"
                  onClick={() =>
                    document
                      .getElementById("login-card")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  data-ocid="hero.primary_button"
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 rounded-full px-6"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  data-ocid="hero.secondary_button"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>

            {/* Right: Login Card */}
            <motion.div
              id="login-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="glass-card-navy rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Sign in to your committee account
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone-input"
                    className="text-white/80 text-sm font-medium block mb-1"
                  >
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-white/10 border border-white/20 rounded-lg text-white/70 text-sm">
                      +91
                    </div>
                    <Input
                      type="tel"
                      id="phone-input"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold"
                      data-ocid="login.input"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    className="w-full green-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                    onClick={handleSendOTP}
                    data-ocid="login.primary_button"
                  >
                    <Phone size={16} className="mr-2" />
                    Send OTP
                  </Button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div>
                        <label
                          htmlFor="otp-input"
                          className="text-white/80 text-sm font-medium block mb-1"
                        >
                          Enter OTP
                          <span className="text-gold/70 text-xs ml-2">
                            (Enter any 6 digits)
                          </span>
                        </label>
                        <Input
                          type="text"
                          id="otp-input"
                          placeholder="6-digit OTP"
                          value={otp}
                          onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, ""))
                          }
                          maxLength={6}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-gold text-center text-2xl tracking-[0.5em] font-bold"
                          data-ocid="login.otp_input"
                        />
                      </div>
                      <Button
                        className="w-full btn-gold py-3 rounded-xl text-base font-semibold"
                        onClick={handleVerifyOTP}
                        disabled={isLoggingIn || otpVerified}
                        data-ocid="login.submit_button"
                      >
                        {isLoggingIn ? (
                          <>
                            <div className="w-4 h-4 border-2 border-navy/50 border-t-navy rounded-full animate-spin mr-2" />{" "}
                            Connecting...
                          </>
                        ) : otpVerified ? (
                          <>
                            <CheckCircle size={16} className="mr-2" /> Verified!
                          </>
                        ) : (
                          "Verify OTP & Login"
                        )}
                      </Button>
                      <button
                        type="button"
                        className="text-white/50 text-xs text-center w-full hover:text-gold transition-colors"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                      >
                        Resend OTP
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-white/40 text-xs text-center">
                  Secured by Internet Computer blockchain
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold gold-text mb-3">
              Why Choose Us?
            </h2>
            <div className="gold-divider max-w-48 mx-auto mb-4" />
            <p className="text-white/60 max-w-xl mx-auto">
              Everything your mosque committee needs to manage contributions
              efficiently.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="green-gradient rounded-2xl p-6 border border-gold/20 hover:border-gold/40 transition-all hover:shadow-gold hover:-translate-y-1"
                data-ocid={`features.card.${i + 1}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-gold" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="green-gradient py-12 px-4 border-y border-gold/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+", label: "Members Managed" },
            { value: "₹50L+", label: "Contributions Tracked" },
            { value: "99.9%", label: "Uptime Guaranteed" },
            { value: "3", label: "UPI Payment Methods" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-gold">{stat.value}</p>
              <p className="text-white/70 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="navy-gradient border-t border-gold/20 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border border-gold overflow-hidden">
                  <img
                    src="/assets/generated/tmc-logo-transparent.dim_200x200.png"
                    alt="TMC"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-gold font-bold text-sm">
                    TENGAKHAT MASJID COMMITTEE
                  </p>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Managing mosque contributions with transparency, efficiency, and
                care for our community.
              </p>
            </div>
            <div>
              <h4 className="text-gold font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["Features", "About", "Contact", "Privacy Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#features"
                        className="text-white/50 hover:text-gold transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-gold font-semibold mb-4">Contact</h4>
              <p className="text-white/50 text-sm">Tengakhat, Assam, India</p>
              <p className="text-white/50 text-sm mt-1">
                committee@tengakhatmasjid.org
              </p>
            </div>
          </div>
          <div className="border-t border-gold/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-white/30 text-sm">
              © {new Date().getFullYear()} Tengakhat Masjid Committee. All
              rights reserved.
            </p>
            <p className="text-white/30 text-xs">
              Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noreferrer"
                className="text-gold/50 hover:text-gold transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
