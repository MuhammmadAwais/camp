"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { ListingDetailData } from "@/lib/types/seller";
import { apiClient } from "@/lib/api-client";

interface AppointmentVoucherCardProps {
  listingId: string;
}

export function AppointmentVoucherCard({ listingId }: AppointmentVoucherCardProps) {
  const [data, setData] = useState<ListingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

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

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Loading dealership voucher pass...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.appointmentVoucher) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-portal-text">Voucher Not Ready</h3>
        <p className="text-sm text-portal-text-muted">An accepted dealership offer is required to view this voucher.</p>
        <Link href={`/seller/listings/${listingId}`} className="text-xs text-portal-primary hover:underline font-semibold">
          Return to Auction Floor
        </Link>
      </div>
    );
  }

  const { auction, appointmentVoucher: voucher } = data;

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/seller/listings/${listingId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auction Floor</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-portal-surface border border-portal-border hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Official Voucher Pass Document */}
      <div className="bg-portal-surface border-2 border-portal-primary/40 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
        {/* Subtle decorative watermarks */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-portal-primary/5 rounded-full blur-3xl -z-10" />

        {/* Voucher Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-portal-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-portal-primary text-white">
                Official Dealership Pass
              </span>
              <span className="text-xs font-mono font-bold text-portal-primary">
                {voucher.voucherCode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-headline text-portal-text">
              Vehicle Handover & Payout Voucher
            </h1>
            <p className="text-xs text-portal-text-muted">
              AutoNexa Canadian Wholesale Exchange • Escrow Verified
            </p>
          </div>

          {/* QR Verification Box */}
          <div className="p-3 bg-white rounded-2xl border border-black/10 shadow-xs flex flex-col items-center shrink-0 self-start sm:self-auto">
            <div className="w-24 h-24 bg-neutral-900 rounded-lg flex items-center justify-center p-2 text-white">
              <QrCode className="w-20 h-20" />
            </div>
            <span className="text-[10px] font-mono text-neutral-600 font-bold mt-1 tracking-wider">
              SCAN AT DEALERSHIP
            </span>
          </div>
        </div>

        {/* Core Deal Figures Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-portal-surface-hover/80 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
              Accepted Purchase Offer
            </span>
            <span className="font-mono text-2xl font-black text-portal-primary mt-1 block">
              {formatCadCents(voucher.acceptedOfferCents)}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Guaranteed by dealer escrow
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-portal-surface-hover/80 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
              Subject Vehicle
            </span>
            <span className="font-headline text-base font-bold text-portal-text mt-1 block truncate">
              {auction.year} {auction.make} {auction.model}
            </span>
            <span className="font-mono text-[11px] text-portal-text-muted">
              VIN: {auction.vin}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-portal-surface-hover/80 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
              Appointment Window
            </span>
            <span className="font-headline text-sm font-bold text-portal-text mt-1 block">
              Within 48 Hours
            </span>
            <span className="text-[11px] text-portal-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-portal-primary" />
              <span>Expires {new Date(voucher.expiresAt).toLocaleDateString("en-CA")}</span>
            </span>
          </div>
        </div>

        {/* Dealership Destination Details */}
        <div className="bg-portal-surface-hover/60 border border-portal-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-portal-primary" />
            <h2 className="text-base font-bold font-headline text-portal-text">
              Purchasing Dealership Destination
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-portal-text-muted block text-[11px]">Dealership Name</span>
                <span className="font-bold text-portal-text text-sm">{voucher.dealershipName}</span>
              </div>
              <div>
                <span className="text-portal-text-muted block text-[11px]">Location & Address</span>
                <span className="font-medium text-portal-text block">{voucher.address}</span>
                <span className="text-portal-text-muted">{voucher.city}, {voucher.province} {voucher.postalCode}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-portal-text-muted block text-[11px]">Direct Purchasing Desk</span>
                <span className="font-medium text-portal-text flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-portal-primary" />
                  <span>{voucher.contactPhone}</span>
                </span>
                <span className="font-medium text-portal-text flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-portal-primary" />
                  <span>{voucher.contactEmail}</span>
                </span>
              </div>
              <div>
                <span className="text-portal-text-muted block text-[11px]">Operating Business Hours</span>
                <span className="font-medium text-portal-text">{voucher.operatingHours}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 no-print">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                `${voucher.dealershipName} ${voucher.address} ${voucher.city} ${voucher.province}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps for Driving Directions</span>
            </a>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold font-headline text-portal-text flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-portal-primary" />
              <span>Mandatory Handover Checklist (Bring to Dealership)</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Check off items as you prepare your vehicle for the 15-minute verification inspection.
            </p>
          </div>

          <div className="space-y-2">
            {voucher.checklist.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-emerald-500/5 border-emerald-500/40 text-portal-text"
                      : "bg-portal-surface-hover/70 border-portal-border text-portal-text hover:border-portal-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(idx)}
                    className="w-4 h-4 rounded text-portal-primary focus:ring-portal-primary accent-portal-primary cursor-pointer shrink-0"
                  />
                  <span className={`text-xs ${isChecked ? "line-through text-portal-text-muted" : "font-medium"}`}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Regulatory Protection Note */}
        <div className="pt-4 border-t border-portal-border flex items-center gap-3 text-xs text-portal-text-muted">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            All AutoNexa transactions are backed by OMVIC (Ontario Motor Vehicle Industry Council) consumer protection.
            Dealership escrow funds are directly disbursed to your verified bank account within 24–48 hours of vehicle drop-off.
          </p>
        </div>
      </div>
    </div>
  );
}
