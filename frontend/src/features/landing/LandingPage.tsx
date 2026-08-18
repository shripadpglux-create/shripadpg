import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Phone,
  LogIn,
  MessageCircle,
  ShieldCheck,
  Settings,
  Headset,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Building2,
  Wifi,
  Utensils,
} from "lucide-react";

import heroBuilding from "@/assets/hero-building.png";
import brandLogo from "@/assets/shripad-logo.png";
import { ShripadNameLogo } from "@/components/ShripadNameLogo";

const featureBadges = [
  { icon: ShieldCheck, title: "24/7 Security", subtitle: "CCTV & Gated Access" },
  { icon: Utensils, title: "Hygienic Meals", subtitle: "3-Time Fresh Food" },
  { icon: Wifi, title: "High-Speed Wi-Fi", subtitle: "Fiber Broadband" },
  { icon: Headset, title: "Dedicated Warden", subtitle: "24/7 Care & Support" },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans selection:bg-brand-green selection:text-white relative overflow-x-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#F0F4FF]/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-brand-green-light/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full px-6 py-4 md:px-12 lg:px-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <ShripadNameLogo />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:+919876543210"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-brand-green transition-colors px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80"
            >
              <Phone className="h-3.5 w-3.5 text-brand-green" />
              +91 98765 43210
            </a>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-green hover:bg-[#00022E] text-white font-extrabold text-xs px-4 py-2.5 shadow-md shadow-brand-green/20 transition cursor-pointer active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex flex-1 items-center px-6 py-12 md:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-12">
          {/* Left content */}
          <div className="order-2 space-y-6 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F0F4FF] px-3.5 py-1 text-xs font-black text-[#00022E] border border-blue-200/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#00022E]" />
              <span>Executive Luxury PG Living in Pune</span>
            </div>

            <h1 className="text-balance text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.12] tracking-tight text-slate-900">
              Premium Living.
              <br />
              <span className="text-brand-green">Trusted Care.</span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed font-semibold text-slate-500">
              Experience comfortable, hassle-free executive living with modern fully furnished rooms, nutritious multi-cuisine meals, high-speed Wi-Fi, and 24/7 dedicated support — all under one roof.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdujAzzMdDMDcO5hZJHTmALxO1eq02TpSD_1_rWFWX535AZqA/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-green hover:bg-[#00022E] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-[#00022E]/25 transition-all active:scale-95"
              >
                <FileText className="h-4 w-4 text-blue-200" />
                <span>Book Room via Google Form</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80 ml-0.5" />
              </a>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition-all active:scale-95"
              >
                <MessageCircle className="h-4 w-4 text-[#00022E]" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>

            <div className="rounded-2xl bg-[#F0F4FF] p-3.5 border border-blue-200/70 text-xs text-slate-600 font-semibold flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-[#00022E] shrink-0 mt-0.5" />
              <p>
                ⚡ <strong className="text-slate-900">Direct Online Admission:</strong> Once you submit the Google Form link above, our admissions team will verify your application and send your resident portal login credentials via WhatsApp!
              </p>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {featureBadges.map((badge) => (
                <div key={badge.title} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-1.5 hover:border-blue-200 transition">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F4FF] text-[#00022E] border border-blue-200/60">
                    <badge.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">
                      {badge.title}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                      {badge.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-100 opacity-60 blur-xl -z-10" />
              <img
                src={heroBuilding}
                alt="Shripad PG premium accommodation building"
                className="w-full max-w-md lg:max-w-lg object-contain drop-shadow-xl hover:scale-[1.02] transition-transform duration-500"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

