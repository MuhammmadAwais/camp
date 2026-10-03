"use client";

import * as React from "react";
import { BodyTypeSelector } from "@/components/marketing/BodyTypeSelector";
import { Search, MapPin, ArrowRight } from "lucide-react";

export function MarketValuationWidget() {
  const [activeTab, setActiveTab] = React.useState("cars");
  const [query, setQuery] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [selectedBodyType, setSelectedBodyType] = React.useState("suv");

  // 3D Tilt & Specular Sheen State
  const [tilt, setTilt] = React.useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle ergonomic tilt within +/- 4 degrees
    const rotateX = -((y - centerY) / centerY) * 4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  const categoryTabs = [
    { id: "cars", label: "Cars & SUVs" },
    { id: "trucks", label: "Trucks & Vans" },
    { id: "electric", label: "Electric & Hybrid" },
    { id: "luxury", label: "Luxury & Performance" },
  ];

  const handleValuationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Starting appraisal valuation for: ${query || "All " + selectedBodyType} in ${postalCode || "Canada"}`
    );
  };

  return (
    <div className="w-full [perspective:1200px]">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: tilt.isHovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.008, 1.008, 1.008)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: tilt.isHovered
            ? "transform 0.1s ease-out, box-shadow 0.2s ease"
            : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease",
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] text-left will-change-transform ${
          tilt.isHovered
            ? "shadow-[0_28px_65px_rgba(0,0,0,0.55),0_0_35px_rgba(229,147,68,0.18),inset_0_1px_2px_rgba(255,255,255,0.3)] border-white/30"
            : ""
        }`}
      >
        {/* Dynamic Specular Glare Overlay */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl transition-opacity duration-300 z-10 overflow-hidden"
          style={{
            opacity: tilt.isHovered ? 0.4 : 0,
            background: `radial-gradient(550px circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.25), rgba(229, 147, 68, 0.12) 45%, transparent 75%)`,
          }}
        />

        {/* Category Tabs (Floating Text with Red Underline on Active) */}
        <div className="relative z-20 flex items-center gap-6 sm:gap-8 border-b border-white/10 overflow-x-auto scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 pt-1 -mb-[2px] font-body text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer bg-transparent border-b-2 outline-none focus:outline-none ${
                  isActive
                    ? "text-white font-bold border-primary"
                    : "text-white/60 hover:text-white font-medium border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Search & Postal Code Input Bar */}
        <form onSubmit={handleValuationSubmit} className="relative z-20 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Make, Model, or VIN input */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                <Search className="w-4 h-4 text-white/60" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Year, Make, Model or 17-Char VIN"
                className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl font-body text-sm font-medium text-white placeholder:text-white/45 focus:outline-none focus:bg-white/[0.14] focus:border-white/45 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
              />
            </div>

            {/* Postal Code input */}
            <div className="sm:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                <MapPin className="w-4 h-4 text-white/60" />
              </div>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                placeholder="Postal Code* (e.g. M5V)"
                maxLength={7}
                className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl font-body text-sm font-medium uppercase text-white placeholder:text-white/45 focus:outline-none focus:bg-white/[0.14] focus:border-white/45 focus:ring-1 focus:ring-white/30 transition-all tracking-wider shadow-inner"
              />
            </div>

            {/* Primary Action Button */}
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-primary/90 hover:bg-primary text-white font-body text-sm font-bold tracking-wide border border-white/20 backdrop-blur-md shadow-[0_4px_20px_rgba(142,34,44,0.45)] hover:shadow-[0_4px_25px_rgba(142,34,44,0.65)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Get Offers</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </form>

        {/* Body Type Cutouts Selector */}
        <div className="relative z-20 mt-5 pt-5 border-t border-white/10">
          <BodyTypeSelector
            selected={selectedBodyType}
            onSelect={(id) => setSelectedBodyType(id)}
          />
        </div>
      </div>
    </div>
  );
}
