"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Car,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import {
  DamageHotspot,
  DamageSeverity,
  DamageViewType,
  useListingWizardStore,
} from "@/store/useListingWizardStore";
import { VehicleSchematicSvg } from "./VehicleSchematicSvg";

const VIEW_TABS: Array<{ key: DamageViewType; label: string }> = [
  { key: "roof", label: "Top / Roof" },
  { key: "driver_side", label: "Driver Side" },
  { key: "passenger_side", label: "Passenger Side" },
  { key: "front", label: "Front" },
  { key: "rear", label: "Rear" },
];

const QUICK_PANEL_TAGS: Record<DamageViewType, string[]> = {
  roof: ["Roof", "Hood", "Windshield", "Trunk / Liftgate", "Sunroof"],
  driver_side: ["Driver Front Door", "Driver Rear Door", "Front Fender", "Rear Quarter Panel", "Front Wheel / Rim", "Rear Wheel / Rim", "Rocker Panel"],
  passenger_side: ["Passenger Front Door", "Passenger Rear Door", "Front Fender", "Rear Quarter Panel", "Front Wheel / Rim", "Rear Wheel / Rim", "Rocker Panel"],
  front: ["Front Bumper", "Grille", "Driver Headlight", "Passenger Headlight", "Lower Valance", "Hood Edge"],
  rear: ["Rear Bumper", "Trunk Lid / Liftgate", "Driver Taillight", "Passenger Taillight", "Rear Glass", "Exhaust Area"],
};

interface DamageMapperStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function DamageMapperStep({ onNext, onBack }: DamageMapperStepProps) {
  const {
    decodedVehicle,
    damageHotspots,
    addDamageHotspot,
    updateDamageHotspot,
    removeDamageHotspot,
    markStepComplete,
  } = useListingWizardStore();

  const [activeView, setActiveView] = useState<DamageViewType>("roof");
  const [editingHotspot, setEditingHotspot] = useState<DamageHotspot | null>(null);
  const [isNewPin, setIsNewPin] = useState(false);

  // Filter hotspots for the active schematic view
  const currentViewHotspots = damageHotspots.filter((h) => h.view === activeView);

  const handleSchematicClick = (coords: { x: number; y: number }) => {
    const defaultTag = QUICK_PANEL_TAGS[activeView][0] || "Panel";
    const newHotspot: DamageHotspot = {
      id: crypto.randomUUID(),
      view: activeView,
      x: coords.x,
      y: coords.y,
      severity: "MINOR",
      areaLabel: defaultTag,
      description: "",
    };
    setEditingHotspot(newHotspot);
    setIsNewPin(true);
  };

  const handleSaveHotspot = () => {
    if (!editingHotspot) return;

    if (isNewPin) {
      addDamageHotspot(editingHotspot);
    } else {
      updateDamageHotspot(editingHotspot.id, editingHotspot);
    }
    setEditingHotspot(null);
    setIsNewPin(false);
  };

  const handleCancelModal = () => {
    setEditingHotspot(null);
    setIsNewPin(false);
  };

  const handleProceed = () => {
    markStepComplete("condition");
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary flex items-center gap-1">
            <Car className="w-3 h-3" />
            <span>
              {decodedVehicle
                ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`
                : "Vehicle Condition"}
            </span>
          </span>
          <span className="text-xs text-portal-text-muted">
            {damageHotspots.length === 0
              ? "0 damage spots tagged"
              : `${damageHotspots.length} damage spot${damageHotspots.length > 1 ? "s" : ""} declared`}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Interactive Damage Hotspot Mapper
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Tap anywhere on the schematic to place pins for scratches, dings, or dents. Transparency helps Canadian wholesale dealers bid with confidence.
        </p>
      </div>

      {/* Main Interactive Mapper Card */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-portal-border-subtle">
          {VIEW_TABS.map((tab) => {
            const count = damageHotspots.filter((h) => h.view === tab.key).length;
            const isActive = activeView === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveView(tab.key);
                  setEditingHotspot(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-portal-primary text-white font-semibold shadow-xs"
                    : "bg-portal-surface-hover text-portal-text hover:text-portal-primary"
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-portal-primary/20 text-portal-primary"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive SVG Canvas */}
        <VehicleSchematicSvg
          view={activeView}
          hotspots={currentViewHotspots}
          onMapClick={handleSchematicClick}
          onHotspotClick={(hotspot) => {
            setEditingHotspot(hotspot);
            setIsNewPin(false);
          }}
          activeHotspotId={editingHotspot?.id}
        />

        {/* Quick No-Damage Affirmation */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-portal-surface-hover border border-portal-border-subtle text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-portal-primary shrink-0" />
            <span className="text-portal-text">
              No cosmetic flaws on your car? You can proceed with 0 tags for showroom condition.
            </span>
          </div>
          {damageHotspots.length === 0 && (
            <span className="text-[11px] font-semibold text-portal-primary flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clean Body</span>
            </span>
          )}
        </div>
      </div>

      {/* Hotspot Configuration Modal / Drawer */}
      {editingHotspot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-portal-primary" />
                <h3 className="text-base font-bold font-headline text-portal-text">
                  {isNewPin ? "Tag Damage Hotspot" : "Edit Damage Hotspot"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelModal}
                className="text-portal-text-muted hover:text-portal-text p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Severity Radio Select */}
            <div>
              <label className="text-xs font-semibold text-portal-text block mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["MINOR", "MODERATE", "SEVERE"] as DamageSeverity[]).map((sev) => {
                  const isSelected = editingHotspot.severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setEditingHotspot({ ...editingHotspot, severity: sev })}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? sev === "MINOR"
                            ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                            : sev === "MODERATE"
                            ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 font-bold"
                            : "bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-bold"
                          : "border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted"
                      }`}
                    >
                      <span className="block capitalize">{sev.toLowerCase()}</span>
                      <span className="text-[10px] block opacity-75">
                        {sev === "MINOR" ? "< 2 in" : sev === "MODERATE" ? "Dents" : "Impact"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Panel Tag Pills */}
            <div>
              <label className="text-xs font-semibold text-portal-text block mb-1.5">
                Panel / Area
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PANEL_TAGS[editingHotspot.view].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setEditingHotspot({ ...editingHotspot, areaLabel: tag })}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      editingHotspot.areaLabel === tag
                        ? "bg-portal-primary text-white font-medium"
                        : "bg-portal-surface-hover border border-portal-border text-portal-text hover:border-portal-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label htmlFor="hotspot-desc" className="text-xs font-semibold text-portal-text block mb-1.5">
                Damage Description
              </label>
              <textarea
                id="hotspot-desc"
                rows={2}
                value={editingHotspot.description}
                onChange={(e) =>
                  setEditingHotspot({ ...editingHotspot, description: e.target.value })
                }
                placeholder="e.g. Superficial shopping cart scratch, clearcoat intact"
                className="w-full px-3 py-2 rounded-xl text-xs bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              {!isNewPin ? (
                <button
                  type="button"
                  onClick={() => {
                    removeDamageHotspot(editingHotspot.id);
                    setEditingHotspot(null);
                  }}
                  className="flex items-center gap-1 text-xs text-error hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Tag</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border border-portal-border text-portal-text hover:bg-portal-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHotspot}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-portal-primary hover:bg-portal-primary-hover text-white transition-all shadow-xs"
                >
                  Save Hotspot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Declared Damage Summary List */}
      {damageHotspots.length > 0 && (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-portal-text uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-portal-primary" />
              <span>Declared Hotspots Summary ({damageHotspots.length})</span>
            </h3>
            <span className="text-[11px] text-portal-text-muted">Click any item to edit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {damageHotspots.map((h, i) => (
              <div
                key={h.id}
                onClick={() => {
                  setActiveView(h.view);
                  setEditingHotspot(h);
                }}
                className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-portal-border bg-portal-surface-hover/40 hover:border-portal-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-portal-primary text-white text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-portal-text">
                        {h.areaLabel || "Damage Spot"}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono ${
                          h.severity === "MINOR"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : h.severity === "MODERATE"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {h.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-portal-text-muted capitalize mt-0.5">
                      {h.view.replace("_", " ")} {h.description ? `• ${h.description}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDamageHotspot(h.id);
                  }}
                  className="text-portal-text-muted hover:text-error transition-colors p-1"
                  title="Remove hotspot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Actions */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Specs</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm"
        >
          <span>Continue to Photo Gallery</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
