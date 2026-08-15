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
} from "lucide-react";

import heroBuilding from "@/assets/hero-building.png";
import brandLogo from "@/assets/shripad-logo.png";

const featureBadges = [
  { icon: ShieldCheck, title: "Secure", subtitle: "Environment" },
  { icon: Settings, title: "Hassle-free", subtitle: "Management" },
  { icon: Headset, title: "24/7 Support", subtitle: "& Assistance" },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="w-full px-6 py-5 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <img
            src={brandLogo}
            alt="Shripad PG — Premium Living, Trusted Care"
            className="h-14 w-auto md:h-16"
          />

          <div className="flex items-center gap-4">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-green"
            >
              <Phone className="h-4 w-4 text-brand-green" />
              +91 98765 43210
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex flex-1 items-center px-6 md:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left content */}
          <div className="order-2 space-y-6 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green md:text-base">
              Welcome to Shripad PG
            </p>

            <h1 className="text-balance text-4xl font-bold leading-[1.15] text-brand-navy md:text-5xl lg:text-[3.25rem]">
              Premium Living.
              <br />
              <span className="text-brand-green">Trusted Care.</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Experience a comfortable and hassle-free stay with modern
              amenities, nutritious meals, high-speed Wi-Fi, and trusted
              support — all under one roof.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdujAzzMdDMDcO5hZJHTmALxO1eq02TpSD_1_rWFWX535AZqA/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-green/90 active:scale-95"
              >
                <FileText className="h-5 w-5 text-amber-300" />
                Book Room / Register via Google Form
                <ExternalLink className="h-4 w-4 opacity-80 ml-0.5" />
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-green bg-white px-6 py-3.5 text-sm font-semibold text-brand-green transition-all hover:bg-brand-green hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Inquiry
              </a>
            </div>
            <p className="text-xs text-muted-foreground font-medium bg-brand-green/10 p-3 rounded-lg border border-brand-green/20">
              ⚡ <strong>Using our reception QR Code?</strong> Once you fill out the Google Form link above, our admin team will review your application and share your login credentials via WhatsApp!
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              {featureBadges.map((badge) => (
                <div key={badge.title} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                    <badge.icon className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-brand-navy">
                      {badge.title}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {badge.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <img
              src={heroBuilding}
              alt="Shripad PG premium accommodation building"
              className="w-full max-w-lg object-contain lg:max-w-xl"
              loading="eager"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
