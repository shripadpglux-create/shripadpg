import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import brandLogo from "@/assets/shripad-logo.png";

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("shripadpglux@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "https://shripadpg.onrender.com" : "http://localhost:5000");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter Admin Email / ID and Password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store JWT token securely
        localStorage.setItem("shripad_auth_token", data.token);
        localStorage.setItem(
          "shripad_admin_session",
          JSON.stringify({
            authenticated: true,
            user: data.user.name,
            email: data.user.email,
            role: data.user.role,
            timestamp: Date.now(),
          })
        );
        navigate({ to: "/admin/dashboard" as any });
      } else {
        setErrorMsg(data.message || "Invalid Admin Email or Password. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Authentication error. Please check your network connection.");
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

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 text-white border border-slate-700 text-xs font-black uppercase tracking-wider mb-2 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
          <span>Shripad PG Admin Portal</span>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Sign In</h2>
        <p className="mt-1.5 text-xs font-bold text-slate-500 max-w-xs mx-auto">
          Enter administrative credentials to access management console
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

          <form className="space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Admin Email / Username
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="shripadpglux@gmail.com"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Admin Passcode / Password
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
                  placeholder="Enter Admin Password"
                  className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-900" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2.5 py-4 px-6 rounded-2xl text-sm font-black text-white bg-slate-900 shadow-xl shadow-slate-900/25 hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Admin Dashboard</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-7 pt-5 border-t border-slate-100 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100/80 px-3.5 py-2 rounded-full border border-slate-200/60">
              <KeyRound className="h-4 w-4 text-slate-700" />
              <span>Restricted Administrative Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
