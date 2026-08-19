import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";
import brandLogo from "@/assets/shripad-logo.png";
import { API_BASE_URL } from "@/lib/apiConfig";
import { generateCustomerCredentials } from "@/lib/credentialUtils";

export function UnifiedPortalLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Persistent Session Guard: Like WhatsApp / Instagram, auto-redirect if already logged in!
  React.useEffect(() => {
    try {
      // 1. Super Admin Persistent Session Check
      const adminSessionStr = localStorage.getItem("shripad_admin_session");
      if (adminSessionStr) {
        const parsed = JSON.parse(adminSessionStr);
        if (parsed && parsed.authenticated) {
          navigate({ to: "/admin/dashboard" as any });
          return;
        }
      }

      // 2. Staff Member Persistent Session Check
      const staffSessionStr = localStorage.getItem("shripad_staff_session");
      if (staffSessionStr) {
        const parsed = JSON.parse(staffSessionStr);
        if (parsed && parsed.authenticated) {
          navigate({ to: "/staff" as any });
          return;
        }
      }

      // 3. Resident / Customer Persistent Session Check
      const customerSessionStr = localStorage.getItem("shripad_customer_session");
      if (customerSessionStr) {
        const parsed = JSON.parse(customerSessionStr);
        if (parsed && (parsed.id || parsed.customerId || parsed.phone)) {
          navigate({ to: "/my-rooms" as any });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Please enter your Email, Mobile, or Customer ID and Password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cleanInputId = identifier.trim();
    const cleanInputIdLower = cleanInputId.toLowerCase();
    const cleanInputPhone = cleanInputId.replace(/\D/g, "");
    const cleanInputPass = password.trim();

    try {
      // ── 1. Try Unified Login Endpoint ──────────────────────────────────────
      let data: any = null;
      let isSuccess = false;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/unified-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: cleanInputId,
            password: cleanInputPass,
            roleHint: "auto",
          }),
        });

        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success) {
            data = resJson;
            isSuccess = true;
          }
        } else if (res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(
            errData.message ||
              "Invalid credentials. Please verify your Email, Mobile, or Customer ID and Password."
          );
          setIsLoading(false);
          return;
        }
      } catch (unifiedErr) {
        console.warn("Unified login endpoint unavailable, attempting role-specific fallbacks...", unifiedErr);
      }

      // ── 2. Fallback: Try Admin Login Endpoint ──────────────────────────────
      if (!isSuccess) {
        try {
          const adminRes = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanInputId, password: cleanInputPass }),
          });
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            if (adminData.success) {
              data = { ...adminData, role: "super_admin", redirectUrl: "/admin/dashboard" };
              isSuccess = true;
            }
          }
        } catch {
          // ignore
        }
      }

      // ── 3. Fallback: Try Staff Login Endpoint ──────────────────────────────
      if (!isSuccess) {
        try {
          const staffRes = await fetch(`${API_BASE_URL}/api/auth/staff-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanInputId, password: cleanInputPass }),
          });
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            if (staffData.success) {
              const isSuper = staffData.staff?.role === "super_admin";
              data = {
                ...staffData,
                role: staffData.staff?.role || "staff",
                redirectUrl: isSuper ? "/admin/dashboard" : "/staff",
              };
              isSuccess = true;
            }
          }
        } catch {
          // ignore
        }
      }

      // ── 4. Fallback: Try Resident / Customer Login Endpoint ────────────────
      if (!isSuccess) {
        try {
          const custRes = await fetch(`${API_BASE_URL}/api/bookings/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: cleanInputId, password: cleanInputPass }),
          });
          if (custRes.ok) {
            const custData = await custRes.json();
            if (custData.success) {
              data = { ...custData, role: "resident", redirectUrl: "/my-rooms" };
              isSuccess = true;
            }
          }
        } catch {
          // ignore
        }
      }

      // ── 5. Process Successful Login ─────────────────────────────────────────
      if (isSuccess && data) {
        setSuccessMsg(data.message || "Authentication successful!");

        // 1. Super Admin Session Dispatch
        if (data.role === "super_admin") {
          localStorage.setItem("shripad_auth_token", data.token || "");
          localStorage.setItem(
            "shripad_admin_session",
            JSON.stringify({
              authenticated: true,
              user: data.user?.name || "Master Admin",
              email: data.user?.email || "shripadpglux@gmail.com",
              role: "super_admin",
              timestamp: Date.now(),
            })
          );
          setTimeout(() => {
            navigate({ to: data.redirectUrl || ("/admin/dashboard" as any) });
          }, 300);
          return;
        }

        // 2. Staff Member Session Dispatch
        if (data.role === "building_manager" || data.role === "caretaker" || data.staff) {
          const staffObj = data.staff || data.user;
          localStorage.setItem("shripad_auth_token", data.token || "");
          localStorage.setItem(
            "shripad_staff_session",
            JSON.stringify({
              authenticated: true,
              staffId: staffObj.id,
              name: staffObj.name,
              email: staffObj.email,
              role: staffObj.role,
              assignedBuildings: staffObj.assignedBuildings,
              timestamp: new Date().toISOString(),
            })
          );
          localStorage.setItem("shripad_staff_id", staffObj.id);
          setTimeout(() => {
            navigate({ to: data.redirectUrl || ("/staff" as any) });
          }, 300);
          return;
        }

        // 3. Resident / Customer Session Dispatch
        if (data.role === "resident" || data.booking) {
          const bookingObj = data.booking || data.user;
          localStorage.setItem("shripad_customer_session", JSON.stringify(bookingObj));
          setTimeout(() => {
            navigate({ to: data.redirectUrl || ("/my-rooms" as any) });
          }, 300);
          return;
        }

        // Default redirect fallback
        if (data.redirectUrl) {
          navigate({ to: data.redirectUrl as any });
          return;
        }
      }

      // ── 6. Local Storage Offline Fallback for Residents ────────────────────
      const localBookingsStr =
        localStorage.getItem("shripad_cached_bookings") ||
        localStorage.getItem("shripad_admin_bookings");
      if (localBookingsStr) {
        try {
          const bookings: any[] = JSON.parse(localBookingsStr);
          const match = bookings.find((b) => {
            const creds = generateCustomerCredentials(b.name || "", b.phone || "");
            const effectiveCustId = (b.customerId || creds.customerId).toLowerCase();
            const effectivePassword = b.customerPassword || creds.customerPassword;
            const effectivePhone = (b.phone || "").replace(/\D/g, "");

            const idMatch =
              effectiveCustId === cleanInputIdLower ||
              (cleanInputPhone.length >= 7 && effectivePhone.endsWith(cleanInputPhone));
            const passMatch = effectivePassword === cleanInputPass;
            return idMatch && passMatch;
          });

          if (match) {
            setSuccessMsg(`Welcome back, ${match.name}!`);
            localStorage.setItem("shripad_customer_session", JSON.stringify(match));
            setTimeout(() => {
              navigate({ to: "/my-rooms" as any });
            }, 300);
            return;
          }
        } catch (e) {
          console.error("Local booking fallback parse error", e);
        }
      }

      setErrorMsg("Invalid credentials. Please verify your Email, Mobile, or Customer ID and Password.");
    } catch (err: any) {
      setErrorMsg("Unable to connect to authentication server. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/60 to-slate-200/50 text-slate-900 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-brand-green selection:text-white">
      {/* Subtle Glow Background Accents */}
      <div className="absolute top-0 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <header className="w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-between z-10 mb-4 px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 text-xs font-bold text-slate-700 hover:text-brand-green hover:border-brand-green/40 shadow-xs hover:shadow-sm transition-all active:scale-95 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand-green group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
          <span>SSL Secured</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-sm sm:max-w-md mx-auto relative z-10 flex flex-col items-center justify-center my-auto">
        {/* Logo Card */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200/80 mb-3 transition-transform hover:scale-105 duration-300 flex items-center justify-center">
          <img
            src={brandLogo}
            alt="Shripad PG"
            className="h-16 sm:h-20 w-auto object-contain max-w-full drop-shadow-xs"
          />
        </div>

        {/* Portal Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2 border bg-[#00022E]/5 text-[#00022E] border-[#00022E]/15 shadow-2xs">
          <Sparkles className="h-3 w-3 text-brand-green" />
          <span>Shripad PG Portal</span>
        </div>

        {/* Header Titles */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-center">
          Welcome Back!
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-500 text-center max-w-xs leading-relaxed">
          Enter your registered credentials to access your account
        </p>

        {/* ── Main Form Card ─────────────────────────────────────────────── */}
        <div className="mt-5 w-full bg-white py-6 sm:py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/80 rounded-3xl border border-slate-200/90 relative">
          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-bold animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs mb-0.5">Authentication Failed</p>
                <p className="font-medium text-slate-700 leading-snug">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs mb-0.5">Access Granted</p>
                <p className="font-medium text-emerald-700 leading-snug">{successMsg} Redirecting...</p>
              </div>
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin}>
            {/* Identifier Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1.5">
                Email, Mobile, or Customer ID
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Email, Mobile, or Customer ID"
                  className="block w-full pl-10 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-900 text-xs sm:text-sm font-bold placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00022E] focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-900 text-xs sm:text-sm font-bold placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00022E] focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-900" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-white bg-[#00022E] hover:bg-[#00044A] shadow-lg shadow-[#00022E]/25 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <>
                    <span>Login to Portal</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Balanced Card Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-semibold text-center sm:text-left">
            <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green shrink-0" />
              <span>Strict Credential Validation</span>
            </span>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-green transition-colors"
            >
              <PhoneCall className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Help: <strong className="text-slate-700 whitespace-nowrap">+91 98765 43210</strong></span>
            </a>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-3 text-center text-slate-400 text-[11px] font-medium z-10">
        Shripad PG • Single Access Portal for Admin, Staff & Residents
      </footer>
    </div>
  );
}


