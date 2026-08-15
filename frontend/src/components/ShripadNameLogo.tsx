import React from "react";

interface ShripadNameLogoProps {
  className?: string;
  showSubtitle?: boolean;
  variant?: "dark" | "white";
}

export function ShripadNameLogo({
  className = "h-10",
  showSubtitle = true,
  variant = "dark",
}: ShripadNameLogoProps) {
  const isWhite = variant === "white";
  const textColor = isWhite ? "text-white" : "text-[#0f1b3d]";
  const subtitleColor = isWhite ? "text-white/90" : "text-[#0f1b3d] opacity-90";

  return (
    <div className={`flex flex-col items-center justify-center text-center font-sans ${className}`}>
      {/* SHRIPAD Header */}
      <h1 className={`text-2xl font-black tracking-[0.12em] ${textColor} leading-none uppercase`}>
        SHRIPAD
      </h1>

      {/* PG Divider Row */}
      <div className="flex items-center justify-center gap-2 my-1 w-full max-w-[170px]">
        <div className="h-[2.5px] flex-1 rounded-full bg-[#D49A3B]" />
        <span className="text-base font-black tracking-wider text-[#16a34a]">PG</span>
        <div className="h-[2.5px] flex-1 rounded-full bg-[#D49A3B]" />
      </div>

      {/* Subtitle */}
      {showSubtitle && (
        <p className={`text-[7.5px] font-extrabold tracking-[0.25em] ${subtitleColor} uppercase leading-none`}>
          PREMIUM LIVING. TRUSTED CARE.
        </p>
      )}
    </div>
  );
}
