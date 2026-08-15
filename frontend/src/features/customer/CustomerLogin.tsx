import { API_BASE_URL } from "../../lib/apiConfig";
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import brandLogo from "@/assets/shripad-logo.png";
import { generateCustomerCredentials } from "@/lib/credentialUtils";

export function CustomerLogin() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim() || !password.trim()) {
      setErrorMsg("Please enter your Customer ID / Phone and Password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const cleanInputId = customerId.trim().toLowerCase();
    const cleanInputPhone = customerId.trim().replace(/\D/g, "");
    const cleanInputPass = password.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customerId.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (data.success && data.booking) {
        localStorage.setItem("shripad_customer_session", JSON.stringify(data.booking));
        navigate({ to: "/my-rooms" as any });
      } else {
        const localBookingsStr = localStorage.getItem("shripad_admin_bookings");
        if (localBookingsStr) {
          const bookings: any[] = JSON.parse(localBookingsStr);
          const match = bookings.find((b) => {
            const creds = generateCustomerCredentials(b.name || "", b.phone || "");
            const effectiveCustId = (b.customerId || creds.customerId).toLowerCase();
            const effectivePassword = b.customerPassword || creds.customerPassword;
            const effectivePhone = (b.phone || "").replace(/\D/g, "");

            const idMatch =
              effectiveCustId === cleanInputId ||
              (cleanInputPhone.length >= 7 && effectivePhone.endsWith(cleanInputPhone));
            const passMatch = effectivePassword === cleanInputPass;
            return idMatch && passMatch;
          });

          if (match) {
            localStorage.setItem("shripad_customer_session", JSON.stringify(match));
            navigate({ to: "/my-rooms" as any });
            return;
          }
        }
        setErrorMsg(data.message || "Invalid Customer ID or Password. Please check credentials sent by Admin.");
      }
    } catch (err) {
      const localBookingsStr = localStorage.getItem("shripad_admin_bookings");
      if (localBookingsStr) {
        const bookings: any[] = JSON.parse(localBookingsStr);
        const match = bookings.find((b) => {
          const creds = generateCustomerCredentials(b.name || "", b.phone || "");
          const effectiveCustId = (b.customerId || creds.customerId).toLowerCase();
          const effectivePassword = b.customerPassword || creds.customerPassword;
          const effectivePhone = (b.phone || "").replace(/\D/g, "");

          const idMatch =
            effectiveCustId === cleanInputId ||
            (cleanInputPhone.length >= 7 && effectivePhone.endsWith(cleanInputPhone));
          const passMatch = effectivePassword === cleanInputPass;
          return idMatch && passMatch;
        });

        if (match) {
          localStorage.setItem("shripad_customer_session", JSON.stringify(match));
          navigate({ to: "/my-rooms" as any });
          return;
        }
      }
      setErrorMsg("Invalid credentials. Please verify your Customer ID and Password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Soft Color Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Full Logo Display in Clean White Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] bg-white shadow-xl shadow-slate-200/80 border border-slate-200/90 mb-4 transition-transform hover:scale-105 duration-300 flex items-center justify-center">
          <img
            src={brandLogo}
            alt="Shripad PG — Premium Living, Trusted Care"
            className="h-24 sm:h-28 w-auto object-contain max-w-full drop-shadow-xs"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Shripad PG Resident Portal</span>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back!</h2>
        <p className="mt-1.5 text-xs font-bold text-slate-500 max-w-xs mx-auto">
          Enter credentials shared by admin upon room allocation
        </p>
      </div>

      {/* Main Login Form Card */}
      <div className="mt-6 w-full max-w-md mx-auto relative z-10 px-4">
        <div className="bg-white py-9 px-6 sm:px-10 shadow-2xl shadow-slate-200/80 rounded-[2.5rem] border border-slate-200/90 relative">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-bold animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm mb-0.5">Authentication Failed</p>
                <p className="font-medium text-slate-700">{errorMsg}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Customer ID / Registered Mobile
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Enter Customer ID or Mobile Number"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-green transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-brand-green" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2.5 py-4 px-6 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-brand-green via-emerald-600 to-brand-green shadow-xl shadow-brand-green/30 hover:shadow-brand-green/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Login to Resident Portal</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-7 pt-5 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100/80 px-3.5 py-2 rounded-full border border-slate-200/60">
              <ShieldCheck className="h-4 w-4 text-brand-green" />
              <span>Secure & Encrypted Resident Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
