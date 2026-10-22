"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  ShieldCheck,
  Printer,
  ExternalLink,
  Award,
  RefreshCw,
  Building2,
  Car,
  DollarSign,
  ChevronsUpDown,
  Navigation,
  KeyRound,
  FileText,
  BadgeCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { ListingDetailData } from "@/lib/types/seller";
import { apiClient } from "@/lib/api-client";
import { VehicleSwitcherModal } from "@/components/seller/VehicleSwitcherModal";

interface AppointmentVoucherCardProps {
  listingId: string;
}

export function AppointmentVoucherCard({ listingId }: AppointmentVoucherCardProps) {
  const [data, setData] = useState<ListingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: true,
    3: false,
  });
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.api.get<ListingDetailData>(`/api/listings/${listingId}?status=ACCEPTED`);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load appointment voucher");
        }
      } catch {
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoucher();
  }, [listingId]);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Loading dealership voucher pass...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.appointmentVoucher) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-headline text-portal-text tracking-tight">
            Handover Voucher Pending Acceptance
          </h2>
          <p className="text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
            Please select and accept a certified dealer offer to generate your official escrow handover pass and inspection instructions.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/seller/listings/${listingId}/select-dealer`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-portal-primary hover:bg-portal-primary-hover text-white shadow-md transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Review Dealer Offers</span>
          </Link>
          <Link
            href={`/seller/listings/${listingId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-portal-text-muted hover:text-portal-text transition-colors"
          >
            <span>Back to Auction</span>
          </Link>
        </div>
      </div>
    );
  }

  const { auction, appointmentVoucher: voucher, photos } = data;
  const coverPhoto = photos?.[0]?.url || "/showcase-cars-with-bg/2025-Toyota-4runner.png";
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = voucher.checklist.length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Navigation Row & Vehicle Switcher Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Link
            href={`/seller/listings/${listingId}/select-dealer`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dealer Offers</span>
          </Link>
          <span className="text-portal-border hidden sm:inline">•</span>
          <span className="text-xs font-mono text-portal-text-muted hidden sm:inline">
            VIN: {auction.vin}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Vehicle Switcher Pill Button */}
          <button
            type="button"
            id="btn-switch-vehicle-voucher"
            onClick={() => setVehicleModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-portal-surface border border-portal-border hover:border-portal-primary/50 text-xs font-medium text-portal-text shadow-2xs hover:bg-portal-surface-hover transition-all cursor-pointer group"
          >
            <Car className="w-3.5 h-3.5 text-portal-primary" />
            <span className="font-semibold">{auction.year} {auction.make} {auction.model}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
              Voucher Active
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-portal-text-muted group-hover:text-portal-text transition-colors" />
          </button>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-portal-surface border border-portal-border hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-portal-primary" />
            <span>Print / PDF Pass</span>
          </button>
        </div>
      </div>

      {/* Top Banner Card (Borderless Canvas Blend) */}
      <div className="bg-gradient-to-b from-portal-surface/90 via-portal-surface/40 to-transparent backdrop-blur-xs rounded-2xl p-5 sm:p-6 space-y-5 border-0 shadow-none outline-none ring-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Offer Accepted • Handover Pass Generated</span>
              </span>
              <span className="text-xs font-mono text-portal-text-muted">
                PASS: {voucher.voucherCode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
              Vehicle Handover & Payout Voucher
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
              Present this pass when dropping off your vehicle. The dealer will verify your vehicle in ~15 minutes and release payment.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-portal-surface border border-portal-border text-xs font-mono font-semibold text-portal-text shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-portal-primary" />
              <span>Valid for 48 Hours</span>
            </span>
          </div>
        </div>

        {/* 4-Metric Summary Bar with Clean Vertical Dividers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-portal-border-subtle/60">
          {/* Col 1: Guaranteed Payout */}
          <div className="flex items-center justify-between pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Guaranteed Payout
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 block">
                {formatCadCents(voucher.acceptedOfferCents)}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Protected by dealer escrow
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Col 2: Dealership Destination */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Winning Dealer
              </span>
              <span className="font-headline text-sm sm:text-base font-bold text-portal-text tracking-tight mt-0.5 block truncate max-w-[140px] sm:max-w-[180px]">
                {voucher.dealershipName}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                OMVIC Licensed Dealer
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Col 3: Handover Window */}
          <div className="flex items-center justify-between lg:border-l border-portal-border-subtle/60 lg:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Drop-off Window
              </span>
              <span className="font-headline text-sm sm:text-base font-bold text-portal-text tracking-tight mt-0.5 block">
                Next 48 Hours
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Expires {new Date(voucher.expiresAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Col 4: Escrow Protection */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Disbursement
              </span>
              <span className="font-headline text-sm sm:text-base font-bold text-portal-text tracking-tight mt-0.5 block">
                Wire / EFT in 24h
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Zero deduction guarantee
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Official High-Security Voucher Pass Document */}
      <div className="bg-portal-surface border border-portal-border rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-portal-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Voucher Pass Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-portal-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-portal-primary text-white shadow-2xs">
                OFFICIAL HANDOVER PASS
              </span>
              <span className="text-xs font-mono font-bold text-portal-primary">
                {voucher.voucherCode}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-headline text-portal-text">
              Wholesale Exchange & Handover Pass
            </h2>
            <p className="text-xs text-portal-text-muted flex items-center gap-2">
              <span>AutoNexa Canadian Wholesale Exchange</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Escrow Verified & Guaranteed</span>
              </span>
            </p>
          </div>

          {/* Scannable Dealership QR Box */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-2xl border border-portal-border shadow-md flex flex-col items-center shrink-0 self-start sm:self-auto">
            <div className="w-28 h-28 bg-neutral-950 text-white rounded-xl flex items-center justify-center p-2.5 relative group">
              <QrCode className="w-24 h-24" />
              {/* Corner Targeting brackets */}
              <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-portal-primary" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-portal-primary" />
              <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-portal-primary" />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-portal-primary" />
            </div>
            <span className="text-[9px] font-mono text-neutral-600 dark:text-neutral-400 font-bold mt-2 tracking-wider uppercase">
              SCAN AT DEALERSHIP DESK
            </span>
          </div>
        </div>

        {/* Vehicle & Guaranteed Deal Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Vehicle Card with Photo (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-portal-surface-hover/50 border border-portal-border p-4 flex flex-col justify-between space-y-4">
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-900">
              <Image
                src={coverPhoto}
                alt={`${auction.year} ${auction.make} ${auction.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 text-white">
                <span className="text-[11px] font-mono text-white/80">VIN: {auction.vin}</span>
                <p className="font-headline font-bold text-sm tracking-tight">
                  {auction.year} {auction.make} {auction.model} {auction.trim}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-portal-surface border border-portal-border/60">
                <span className="text-[10px] text-portal-text-muted uppercase font-mono block">Odometer</span>
                <span className="font-bold text-portal-text font-mono mt-0.5 block">
                  {auction.mileageKm.toLocaleString()} km
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-portal-surface border border-portal-border/60">
                <span className="text-[10px] text-portal-text-muted uppercase font-mono block">Location</span>
                <span className="font-bold text-portal-text mt-0.5 block truncate">
                  {auction.city}, {auction.province}
                </span>
              </div>
            </div>
          </div>

          {/* Dealership Destination & Drop-off Desk (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-portal-surface-hover/50 border border-portal-border p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-portal-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-portal-text">
                    Purchasing Dealership
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-portal-surface border border-portal-border text-portal-text-muted">
                  OMVIC-481920
                </span>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-headline text-portal-text">
                    {voucher.dealershipName}
                  </h3>
                  <p className="text-xs text-portal-text-muted flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-portal-primary shrink-0 mt-0.5" />
                    <span>{voucher.address}, {voucher.city}, {voucher.province} {voucher.postalCode}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <a
                    href={`tel:${voucher.contactPhone.replace(/[^0-9]/g, "")}`}
                    className="p-2.5 rounded-xl bg-portal-surface border border-portal-border/60 flex items-center gap-2 hover:border-portal-primary/40 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-portal-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-portal-text-muted block">Direct Desk</span>
                      <span className="font-semibold text-portal-text">{voucher.contactPhone}</span>
                    </div>
                  </a>

                  <a
                    href={`mailto:${voucher.contactEmail}`}
                    className="p-2.5 rounded-xl bg-portal-surface border border-portal-border/60 flex items-center gap-2 hover:border-portal-primary/40 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-portal-primary shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-portal-text-muted block">Direct Email</span>
                      <span className="font-semibold text-portal-text truncate block">{voucher.contactEmail}</span>
                    </div>
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-portal-surface border border-portal-border/60 text-xs flex items-center gap-2 text-portal-text-muted">
                  <Clock className="w-4 h-4 text-portal-primary shrink-0" />
                  <span><strong>Hours:</strong> {voucher.operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="no-print pt-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${voucher.dealershipName} ${voucher.address} ${voucher.city} ${voucher.province}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-portal-primary hover:bg-portal-primary-hover text-white shadow-sm transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps for Driving Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Handover Checklist Section */}
        <div className="space-y-4 pt-4 border-t border-portal-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold font-headline text-portal-text flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-portal-primary" />
                <span>What to Bring (Dealership Drop-Off Checklist)</span>
              </h3>
              <p className="text-xs text-portal-text-muted mt-0.5">
                Check off each required item before driving to the dealership for your 15-minute verification.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-portal-surface border border-portal-border text-portal-text self-start sm:self-auto">
              {checkedCount} of {totalItems} Prepared
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {voucher.checklist.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "bg-emerald-500/10 border-emerald-500/40 text-portal-text shadow-2xs"
                      : "bg-portal-surface-hover/70 border-portal-border text-portal-text hover:border-portal-primary/40 hover:bg-portal-surface-hover"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked
                        ? "bg-emerald-500 text-white"
                        : "border border-portal-border bg-portal-surface text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span
                      className={`text-xs block ${
                        isChecked ? "font-semibold text-portal-text" : "font-medium text-portal-text"
                      }`}
                    >
                      {item}
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      {idx === 0 && "Signed on the vehicle transfer line"}
                      {idx === 1 && "Both operational master smart keys"}
                      {idx === 2 && "Valid provincial driver's license"}
                      {idx === 3 && "For guaranteed electronic escrow payout"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regulatory Protection & Escrow Guarantee Footer */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 text-xs text-portal-text">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-portal-text text-xs flex items-center gap-1.5">
              <span>OMVIC & Canadian Regulatory Consumer Escrow Protection</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                Law 25 & PIPEDA Compliant
              </span>
            </h4>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Your sale price of <strong>{formatCadCents(voucher.acceptedOfferCents)}</strong> is held in certified dealer escrow.
              Once the 15-minute physical drop-off check is completed, funds are wired immediately to your verified account without fees or renegotiation.
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Switcher Modal */}
      <VehicleSwitcherModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        currentListingId={listingId}
        currentListingFallback={{
          year: auction.year,
          make: auction.make,
          model: auction.model,
          vin: auction.vin,
          status: auction.status,
          thumbnailUrl: coverPhoto,
        }}
      />
    </div>
  );
}
