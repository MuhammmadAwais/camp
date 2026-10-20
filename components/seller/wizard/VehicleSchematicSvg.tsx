"use client";

import React, { useRef } from "react";
import type { DamageHotspot, DamageViewType, DamageSeverity } from "@/store/useListingWizardStore";

interface VehicleSchematicSvgProps {
  view: DamageViewType;
  hotspots: DamageHotspot[];
  onMapClick: (coords: { x: number; y: number }) => void;
  onHotspotClick: (hotspot: DamageHotspot) => void;
  activeHotspotId?: string | null;
}

const SEVERITY_COLORS: Record<DamageSeverity, { bg: string; border: string; ring: string }> = {
  MINOR: { bg: "#E59344", border: "#B45309", ring: "rgba(229, 147, 68, 0.4)" },
  MODERATE: { bg: "#EA580C", border: "#C2410C", ring: "rgba(234, 88, 12, 0.4)" },
  SEVERE: { bg: "#DC2626", border: "#991B1B", ring: "rgba(220, 38, 38, 0.4)" },
};

export function VehicleSchematicSvg({
  view,
  hotspots,
  onMapClick,
  onHotspotClick,
  activeHotspotId,
}: VehicleSchematicSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on an existing pin marker, let the pin handler capture it
    if ((e.target as HTMLElement).closest("[data-hotspot-pin]")) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    onMapClick({
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative w-full aspect-16/9 sm:aspect-2/1 bg-portal-surface-hover/60 border border-portal-border rounded-2xl overflow-hidden cursor-crosshair select-none flex items-center justify-center p-4 transition-colors hover:border-portal-primary/40 group"
      title="Click anywhere on the schematic to place a damage pin"
    >
      {/* View Hint Overlay */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-portal-surface/90 border border-portal-border text-[11px] font-mono uppercase tracking-wider text-portal-text-muted pointer-events-none">
        {view === "roof"
          ? "Top / Bird's Eye View"
          : view === "driver_side"
          ? "Driver Side (Left)"
          : view === "passenger_side"
          ? "Passenger Side (Right)"
          : view === "front"
          ? "Front Fascia"
          : "Rear Fascia"}
      </div>

      <div className="absolute top-3 right-3 text-[10px] text-portal-text-muted/70 flex items-center gap-1 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-portal-primary animate-pulse" />
        <span>Click vehicle body to tag damage</span>
      </div>

      {/* 1. TOP / BIRD'S EYE VIEW */}
      {view === "roof" && (
        <svg
          viewBox="0 0 500 240"
          className="w-full h-full max-h-[220px] stroke-portal-text/30 fill-portal-surface text-portal-text transition-all duration-300 group-hover:stroke-portal-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main Body Shell */}
          <path
            d="M 90 120 C 90 70, 110 50, 160 48 L 340 48 C 390 50, 410 70, 410 120 C 410 170, 390 190, 340 192 L 160 192 C 110 190, 90 170, 90 120 Z"
            className="fill-portal-surface-hover/80 stroke-portal-text/40"
          />
          {/* Front Bumper & Hood */}
          <path d="M 90 120 C 90 90, 105 60, 145 56 L 145 184 C 105 180, 90 150, 90 120 Z" />
          <path d="M 145 65 L 205 75 L 205 165 L 145 175" className="stroke-portal-text/25 fill-none" />
          {/* Windshield */}
          <path
            d="M 210 75 L 245 85 L 245 155 L 210 165 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          {/* Roof */}
          <rect
            x="245"
            y="85"
            width="80"
            height="70"
            rx="4"
            className="fill-portal-surface stroke-portal-text/30"
          />
          {/* Rear Window */}
          <path
            d="M 325 85 L 350 78 L 350 162 L 325 155 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          {/* Trunk */}
          <path d="M 350 78 C 380 82, 400 95, 405 120 C 400 145, 380 158, 350 162 Z" />
          {/* Side Mirrors */}
          <rect x="215" y="36" width="16" height="12" rx="3" className="fill-portal-surface stroke-portal-text/40" />
          <rect x="215" y="192" width="16" height="12" rx="3" className="fill-portal-surface stroke-portal-text/40" />
          {/* Tires (visible top edges) */}
          <rect x="135" y="38" width="30" height="8" rx="2" className="fill-portal-text/60" />
          <rect x="135" y="194" width="30" height="8" rx="2" className="fill-portal-text/60" />
          <rect x="330" y="38" width="30" height="8" rx="2" className="fill-portal-text/60" />
          <rect x="330" y="194" width="30" height="8" rx="2" className="fill-portal-text/60" />
        </svg>
      )}

      {/* 2. DRIVER SIDE VIEW */}
      {view === "driver_side" && (
        <svg
          viewBox="0 0 540 200"
          className="w-full h-full max-h-[220px] stroke-portal-text/30 fill-portal-surface transition-all duration-300 group-hover:stroke-portal-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Car Body Silhouette */}
          <path
            d="M 45 140 L 70 140 C 70 115, 110 115, 110 140 L 370 140 C 370 115, 410 115, 410 140 L 490 140 C 495 130, 492 110, 480 100 L 450 95 L 390 60 L 260 55 L 180 90 L 80 100 C 50 105, 40 120, 45 140 Z"
            className="fill-portal-surface-hover/80 stroke-portal-text/50"
          />
          {/* Windows / Greenhouse */}
          <path
            d="M 188 88 L 260 59 L 382 64 L 442 94 L 340 94 L 260 94 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          {/* Door Cutlines */}
          <path d="M 260 59 L 260 140" className="stroke-portal-text/30" />
          <path d="M 188 88 L 188 140" className="stroke-portal-text/30" />
          <path d="M 350 94 L 350 140" className="stroke-portal-text/30" />
          {/* Door Handles */}
          <rect x="225" y="102" width="18" height="4" rx="2" className="fill-portal-text/40 stroke-none" />
          <rect x="315" y="102" width="18" height="4" rx="2" className="fill-portal-text/40 stroke-none" />
          {/* Wheels */}
          <circle cx="90" cy="140" r="24" className="fill-portal-text/70 stroke-portal-text" />
          <circle cx="90" cy="140" r="14" className="fill-portal-surface stroke-portal-text/50" />
          <circle cx="390" cy="140" r="24" className="fill-portal-text/70 stroke-portal-text" />
          <circle cx="390" cy="140" r="14" className="fill-portal-surface stroke-portal-text/50" />
        </svg>
      )}

      {/* 3. PASSENGER SIDE VIEW */}
      {view === "passenger_side" && (
        <svg
          viewBox="0 0 540 200"
          className="w-full h-full max-h-[220px] stroke-portal-text/30 fill-portal-surface transition-all duration-300 group-hover:stroke-portal-primary/40 transform -scale-x-100"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Reversible Side Silhouette */}
          <path
            d="M 45 140 L 70 140 C 70 115, 110 115, 110 140 L 370 140 C 370 115, 410 115, 410 140 L 490 140 C 495 130, 492 110, 480 100 L 450 95 L 390 60 L 260 55 L 180 90 L 80 100 C 50 105, 40 120, 45 140 Z"
            className="fill-portal-surface-hover/80 stroke-portal-text/50"
          />
          <path
            d="M 188 88 L 260 59 L 382 64 L 442 94 L 340 94 L 260 94 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          <path d="M 260 59 L 260 140" className="stroke-portal-text/30" />
          <path d="M 188 88 L 188 140" className="stroke-portal-text/30" />
          <path d="M 350 94 L 350 140" className="stroke-portal-text/30" />
          <rect x="225" y="102" width="18" height="4" rx="2" className="fill-portal-text/40 stroke-none" />
          <rect x="315" y="102" width="18" height="4" rx="2" className="fill-portal-text/40 stroke-none" />
          <circle cx="90" cy="140" r="24" className="fill-portal-text/70 stroke-portal-text" />
          <circle cx="90" cy="140" r="14" className="fill-portal-surface stroke-portal-text/50" />
          <circle cx="390" cy="140" r="24" className="fill-portal-text/70 stroke-portal-text" />
          <circle cx="390" cy="140" r="14" className="fill-portal-surface stroke-portal-text/50" />
        </svg>
      )}

      {/* 4. FRONT VIEW */}
      {view === "front" && (
        <svg
          viewBox="0 0 400 240"
          className="w-full h-full max-h-[220px] stroke-portal-text/30 fill-portal-surface transition-all duration-300 group-hover:stroke-portal-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main Cabin & Roof */}
          <path
            d="M 120 70 C 140 50, 260 50, 280 70 L 320 115 L 80 115 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          {/* Front Body & Bumper */}
          <path
            d="M 60 130 C 60 115, 80 115, 120 115 L 280 115 C 320 115, 340 115, 340 130 L 335 180 C 330 195, 300 200, 200 200 C 100 200, 70 195, 65 180 Z"
            className="fill-portal-surface-hover/80 stroke-portal-text/50"
          />
          {/* Grille */}
          <rect
            x="140"
            y="135"
            width="120"
            height="35"
            rx="6"
            className="fill-portal-surface stroke-portal-text/40"
          />
          <line x1="140" y1="147" x2="260" y2="147" className="stroke-portal-text/25" />
          <line x1="140" y1="158" x2="260" y2="158" className="stroke-portal-text/25" />
          {/* Headlights */}
          <path d="M 85 130 L 130 135 L 125 150 L 80 142 Z" className="fill-amber-400/20 stroke-portal-text/50" />
          <path d="M 315 130 L 270 135 L 275 150 L 320 142 Z" className="fill-amber-400/20 stroke-portal-text/50" />
          {/* Side Mirrors */}
          <path d="M 78 110 L 45 105 L 50 125 L 80 120 Z" className="fill-portal-surface stroke-portal-text/40" />
          <path d="M 322 110 L 355 105 L 350 125 L 320 120 Z" className="fill-portal-surface stroke-portal-text/40" />
          {/* Tires */}
          <rect x="68" y="170" width="22" height="40" rx="4" className="fill-portal-text/70" />
          <rect x="310" y="170" width="22" height="40" rx="4" className="fill-portal-text/70" />
        </svg>
      )}

      {/* 5. REAR VIEW */}
      {view === "rear" && (
        <svg
          viewBox="0 0 400 240"
          className="w-full h-full max-h-[220px] stroke-portal-text/30 fill-portal-surface transition-all duration-300 group-hover:stroke-portal-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Roof & Rear Window */}
          <path
            d="M 125 70 C 145 52, 255 52, 275 70 L 315 118 L 85 118 Z"
            className="fill-portal-primary/5 stroke-portal-text/40"
          />
          {/* Rear Body & Bumper */}
          <path
            d="M 60 130 C 60 118, 85 118, 120 118 L 280 118 C 315 118, 340 118, 340 130 L 335 185 C 330 198, 300 200, 200 200 C 100 200, 70 198, 65 185 Z"
            className="fill-portal-surface-hover/80 stroke-portal-text/50"
          />
          {/* Trunk Outline */}
          <path
            d="M 130 125 L 270 125 L 260 170 L 140 170 Z"
            className="fill-portal-surface stroke-portal-text/30"
          />
          {/* License Plate Recess */}
          <rect x="165" y="145" width="70" height="22" rx="3" className="fill-portal-surface-hover stroke-portal-text/25" />
          {/* Taillights */}
          <path d="M 80 130 L 130 132 L 125 148 L 78 142 Z" className="fill-red-500/30 stroke-red-600/60" />
          <path d="M 320 130 L 270 132 L 275 148 L 322 142 Z" className="fill-red-500/30 stroke-red-600/60" />
          {/* Exhaust Tips */}
          <circle cx="105" cy="192" r="6" className="fill-portal-text/50 stroke-portal-text/30" />
          <circle cx="295" cy="192" r="6" className="fill-portal-text/50 stroke-portal-text/30" />
          {/* Tires */}
          <rect x="68" y="170" width="22" height="40" rx="4" className="fill-portal-text/70" />
          <rect x="310" y="170" width="22" height="40" rx="4" className="fill-portal-text/70" />
        </svg>
      )}

      {/* RENDER PLACED HOTSPOT PINS */}
      {hotspots.map((h, index) => {
        const colors = SEVERITY_COLORS[h.severity] || SEVERITY_COLORS.MINOR;
        const isActive = activeHotspotId === h.id;

        return (
          <div
            key={h.id}
            data-hotspot-pin="true"
            onClick={(e) => {
              e.stopPropagation();
              onHotspotClick(h);
            }}
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin"
          >
            {/* Pulsing ring indicator */}
            <span
              className="absolute -inset-2 rounded-full animate-ping opacity-75 pointer-events-none"
              style={{ backgroundColor: colors.ring }}
            />

            {/* Pin Marker Badge */}
            <div
              className={`relative flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold font-mono shadow-md border-2 transition-transform transform ${
                isActive ? "scale-125 ring-2 ring-white" : "hover:scale-110"
              }`}
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
              }}
            >
              {index + 1}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pin:flex flex-col items-center pointer-events-none z-30">
              <div className="bg-portal-surface border border-portal-border text-portal-text text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap">
                <span className="font-semibold">{h.areaLabel || "Damage Spot"}</span>:{" "}
                <span className="text-portal-text-muted">{h.severity}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-portal-surface border-r border-b border-portal-border transform rotate-45 -mt-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
