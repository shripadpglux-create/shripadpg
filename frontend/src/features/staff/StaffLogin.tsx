import { API_BASE_URL } from "../../lib/apiConfig";
import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ShieldCheck, Mail, Lock, Building2, UserCheck, AlertCircle, ArrowRight, Home, KeyRound, Eye, EyeOff } from "lucide-react";
import brandLogo from "@/assets/shripad-logo.png";

export function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Persistent Session Guard
  React.useEffect(() => {
    try {
      const staffSessionStr = localStorage.getItem("shripad_staff_session");
      if (staffSessionStr) {
        const parsed = JSON.parse(staffSessionStr);
        if (parsed && parsed.authenticated) {
          navigate({ to: "/staff" as any });
        }
      }
    } catch {}
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter assigned Staff Email and Password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (data.success && data.staff) {
        // Store JWT token for authenticated API calls
        if (data.token) {
          localStorage.setItem("shripad_auth_token", data.token);
        }

        // Save staff session in localStorage
        const staffSession = {
          authenticated: true,
          staffId: data.staff.id,
          name: data.staff.name,
          email: data.staff.email,
          role: data.staff.role,
          assignedBuildings: data.staff.assignedBuildings,
          timestamp: new Date().toISOString(),
        };

        localStorage.setItem("shripad_staff_session", JSON.stringify(staffSession));
        localStorage.setItem("shripad_staff_id", data.staff.id);

        // Redirect to /staff dashboard
        navigate({ to: "/staff" as any });
      } else {
        setError(data.message || "Invalid staff email or password. Password fixed by Super Admin.");
      }
    } catch (err) {
      setError("Unable to connect to staff authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Soft Color Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F0F4FF]0/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation Link (Centered Pill) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center z-10 mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-black text-slate-700 hover:text-brand-green hover:border-brand-green/40 shadow-xs hover:shadow-md transition-all active:scale-95 group cursor-pointer"
        >
          <Home className="h-4 w-4 text-slate-500 group-hover:text-brand-green transition" />
          <span>← Back to Home Page</span>
        </Link>
      </div>

      {/* Header Container with Logo Card */}
      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center justify-center text-center">
        {/* Full Logo Display in Clean White Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] bg-white shadow-xl shadow-slate-200/80 border border-slate-200/90 mb-4 transition-transform hover:scale-105 duration-300 flex items-center justify-center">
          <img
            src={brandLogo}
            alt="Shripad PG — Premium Living, Trusted Care"
            className="h-24 sm:h-28 w-auto object-contain max-w-full drop-shadow-xs"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0F4FF] text-[#00022E] border border-blue-200 text-xs font-black uppercase tracking-wider mb-2 shadow-2xs">
          <UserCheck className="h-3.5 w-3.5 text-[#00022E]" />
          <span>Shripad PG Staff Portal</span>
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Staff Member Sign In</h2>
        <p className="mt-1.5 text-xs font-bold text-slate-500 max-w-xs mx-auto">
          Access your assigned property dashboard with credentials fixed by Super Admin
        </p>
      </div>

      {/* Main Login Form Card */}
      <div className="mt-6 w-full max-w-md mx-auto relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/80 rounded-[2.5rem] border border-slate-200/90 relative space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm mb-0.5">Authentication Failed</p>
                <p className="font-medium text-slate-700">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Assigned Staff Email / ID
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@shripadpg.com"
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Fixed Login Password
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
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-900" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-1.5 flex items-center gap-1">
                🔒 Password is assigned & fixed by Super Admin (Staff cannot modify)
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2.5 py-4 px-6 rounded-2xl text-sm font-black text-white bg-brand-green shadow-xl shadow-brand-green/20 hover:bg-brand-gold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating Staff...</span>
                ) : (
                  <>
                    <span>Enter Staff Portal</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-400 text-[11px] font-medium z-10">
        Shripad PG • Property Management & Caretaker Authentication System
      </footer>
    </div>
  );
}
