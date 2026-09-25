"use client";

import * as React from "react";
import { BodyTypeSelector } from "@/components/marketing/BodyTypeSelector";
import { Search, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export function MarketValuationWidget() {
  const [activeTab, setActiveTab] = React.useState("cars");
  const [query, setQuery] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [selectedBodyType, setSelectedBodyType] = React.useState("suv");

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
    <div className="w-full bg-surface-container-lowest/95 backdrop-blur-md border border-border-card rounded-2xl p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-6px_rgba(56,20,24,0.12)]">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 pb-4 border-b border-border-card/60 overflow-x-auto scrollbar-none">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg font-body text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Search & Postal Code Input Bar */}
      <form onSubmit={handleValuationSubmit} className="mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Make, Model, or VIN input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/50">
              <Search className="w-4 h-4 text-outline" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Year, Make, Model or 17-Char VIN"
              className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low/70 border border-outline-variant/60 rounded-xl font-body text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Postal Code input */}
          <div className="sm:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/50">
              <MapPin className="w-4 h-4 text-outline" />
            </div>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="Postal Code* (e.g. M5V)"
              maxLength={7}
              className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low/70 border border-outline-variant/60 rounded-xl font-mono text-sm font-medium uppercase text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Primary Action Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-body text-sm font-bold tracking-wide hover:bg-primary-hover active:scale-[0.98] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-secondary-fixed transition-transform group-hover:rotate-12" />
              <span>Get Offers</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </form>

      {/* Body Type Cutouts Selector (Inspired by AutoTrader) */}
      <div className="mt-5 pt-5 border-t border-border-card/60">
        <BodyTypeSelector
          selected={selectedBodyType}
          onSelect={(id) => setSelectedBodyType(id)}
        />
      </div>

      {/* Footer Trust Bar */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span>No Obligation • 100% Free for Private Sellers • Licensed Canadian Dealers</span>
        </div>
        <span className="font-mono text-[11px] text-secondary font-semibold">
          Ontario (OMVIC) • Alberta (AMVIC) • BC (VSA)
        </span>
      </div>
    </div>
  );
}
