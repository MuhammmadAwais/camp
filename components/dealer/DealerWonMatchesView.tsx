"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { useDealerWonMatches, useLogMatchOutcome } from "@/hooks/useDealerBids";
import { getErrorMessage } from "@/lib/api-errors";
import type {
  LogMatchOutcomeValue,
  WonMatchItem,
  WonMatchStatus,
} from "@/lib/types/dealer";
import { formatCadCents } from "@/lib/utils";

export type { WonMatchItem, WonMatchStatus } from "@/lib/types/dealer";

type MatchFilterTab = "ALL" | "SCHEDULED" | "COMPLETED" | "CLOSED";
type MatchSortKey = "LATEST" | "PRICE_DESC" | "PRICE_ASC" | "MILEAGE";

const CAR_BRAND_LOGOS: Record<string, string> = {
  toyota: "/car-company-logos/image_16 - Copy.png",
  jeep: "/car-company-logos/image_15.png",
  ford: "/car-company-logos/image_14.svg",
  honda: "/car-company-logos/image_12.png",
  polestar: "/car-company-logos/image_11.png",
  mitsubishi: "/car-company-logos/image_10.png",
  hyundai: "/car-company-logos/image_09.png",
  cadillac: "/car-company-logos/image_13.png",
};

const emptySubscribe = () => () => {};

function formatWonAtLabel(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Recently";
  return new Date(parsed).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatWindowRemaining(expiresAtIso: string, nowMs: number): string {
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) return "24h window";
  const diff = expiresMs - nowMs;
  if (diff <= 0) return "Appointment window expired";
  const hours = Math.floor(diff / (3600 * 1000));
  const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m remaining`;
}

function renderStatusBadge(status: WonMatchStatus) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/25">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed &amp; Settled</span>
        </span>
      );
    case "RENEGOTIATED_LOWER":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/25">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Adjusted &amp; Settled</span>
        </span>
      );
    case "NO_SHOW":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/25">
          <XCircle className="w-3.5 h-3.5" />
          <span>Seller No-Show</span>
        </span>
      );
    case "DECLINED_AFTER_INSPECTION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/25">
          <XCircle className="w-3.5 h-3.5" />
          <span>Declined After Inspection</span>
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-portal-surface-hover text-portal-text-muted text-xs font-bold border border-portal-border">
          <Clock className="w-3.5 h-3.5" />
          <span>Window Expired</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span>Appointment Confirmed</span>
        </span>
      );
  }
}

export function DealerWonMatchesView() {
  const t = useTranslations("dealer");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useDealerWonMatches();
  const outcomeMutation = useLogMatchOutcome();

  const matches = useMemo(() => data?.items ?? [], [data]);
  const [filterTab, setFilterTab] = useState<MatchFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<MatchSortKey>("LATEST");
  const [editingMatch, setEditingMatch] = useState<WonMatchItem | null>(null);
  const [selectedQrMatch, setSelectedQrMatch] = useState<WonMatchItem | null>(
    null
  );
  const [newStatus, setNewStatus] =
    useState<LogMatchOutcomeValue>("COMPLETED");
  const [finalPriceInput, setFinalPriceInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [clientNowMs, setClientNowMs] = useState<number>(() => Date.now());

  const hasScheduled = useMemo(
    () => matches.some((m) => m.status === "APPOINTMENT_CONFIRMED"),
    [matches]
  );

  useEffect(() => {
    if (!hasScheduled) return;
    const interval = setInterval(() => {
      setClientNowMs(Date.now());
    }, 60_000);
    return () => clearInterval(interval);
  }, [hasScheduled]);

  const serverTime = data?.serverTime;
  const serverOffsetMs = useMemo(() => {
    if (!serverTime || !dataUpdatedAt || dataUpdatedAt <= 0) return 0;
    const parsed = Date.parse(serverTime);
    return Number.isFinite(parsed) ? parsed - dataUpdatedAt : 0;
  }, [serverTime, dataUpdatedAt]);

  const effectiveNowMs = clientNowMs + serverOffsetMs;

  useEffect(() => {
    const isAnyModalOpen = Boolean(editingMatch || selectedQrMatch);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !outcomeMutation.isPending) {
        setEditingMatch(null);
        setSelectedQrMatch(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingMatch, selectedQrMatch, outcomeMutation.isPending]);

  const filteredMatches = useMemo(() => {
    let result = matches.filter((m) => {
      if (filterTab === "SCHEDULED") {
        return m.status === "APPOINTMENT_CONFIRMED";
      }
      if (filterTab === "COMPLETED") {
        return m.status === "COMPLETED" || m.status === "RENEGOTIATED_LOWER";
      }
      if (filterTab === "CLOSED") {
        return (
          m.status === "DECLINED_AFTER_INSPECTION" ||
          m.status === "NO_SHOW" ||
          m.status === "EXPIRED"
        );
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.seller.name.toLowerCase().includes(q) ||
          m.seller.email.toLowerCase().includes(q) ||
          m.seller.phone.toLowerCase().includes(q) ||
          m.voucherCode.toLowerCase().includes(q) ||
          m.vehicle.vin.toLowerCase().includes(q) ||
          m.vehicle.make.toLowerCase().includes(q) ||
          m.vehicle.model.toLowerCase().includes(q) ||
          m.vehicle.trim.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === "PRICE_DESC") {
        return (
          (b.finalTransactionCents ?? b.acceptedBidAmountCents) -
          (a.finalTransactionCents ?? a.acceptedBidAmountCents)
        );
      }
      if (sortBy === "PRICE_ASC") {
        return (
          (a.finalTransactionCents ?? a.acceptedBidAmountCents) -
          (b.finalTransactionCents ?? b.acceptedBidAmountCents)
        );
      }
      if (sortBy === "MILEAGE") {
        return a.vehicle.mileageKm - b.vehicle.mileageKm;
      }
      return Date.parse(b.wonAt) - Date.parse(a.wonAt);
    });
  }, [matches, filterTab, searchQuery, sortBy]);

  const openInspectionModal = (match: WonMatchItem) => {
    setEditingMatch(match);
    setNewStatus("COMPLETED");
    setFinalPriceInput(
      (
        (match.finalTransactionCents ?? match.acceptedBidAmountCents) / 100
      ).toString()
    );
    setNotesInput(match.inspectionNotes || "");
    setModalError(null);
  };

  const handleSelectStatus = (status: LogMatchOutcomeValue) => {
    setNewStatus(status);
    setModalError(null);
    if (!editingMatch) return;

    if (status === "COMPLETED" || status === "APPOINTMENT_CONFIRMED") {
      setFinalPriceInput(
        (editingMatch.acceptedBidAmountCents / 100).toString()
      );
    } else if (status === "RENEGOTIATED_LOWER") {
      const adjustedDollars = Math.max(
        100,
        Math.round(editingMatch.acceptedBidAmountCents / 100 - 500)
      );
      setFinalPriceInput(adjustedDollars.toString());
    } else {
      setFinalPriceInput("0");
    }
  };

  const handleAddQuickTag = (tag: string) => {
    setNotesInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag + ".";
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return prev;
      return trimmed.replace(/\.*$/, "") + ` • ${tag}.`;
    });
  };

  const handleApplyPriceDelta = (deltaDollars: number) => {
    if (!editingMatch) return;
    const baseDollars = editingMatch.acceptedBidAmountCents / 100;
    const newAmount = Math.max(0, baseDollars + deltaDollars);
    setFinalPriceInput(newAmount.toString());
    setModalError(null);
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    setModalError(null);

    const trimmedNotes = notesInput.trim();
    const parsedDollars = parseFloat(finalPriceInput.replace(/[^0-9.]/g, ""));
    const parsedCents = Number.isNaN(parsedDollars)
      ? editingMatch.acceptedBidAmountCents
      : Math.round(parsedDollars * 100);

    if (newStatus === "RENEGOTIATED_LOWER") {
      if (parsedCents <= 0 || parsedCents >= editingMatch.acceptedBidAmountCents) {
        setModalError(
          `Adjusted settlement must be greater than $0 and below ${formatCadCents(editingMatch.acceptedBidAmountCents)}.`
        );
        return;
      }
      if (trimmedNotes.length < 5) {
        setModalError(
          "Please enter inspection notes (at least 5 characters) justifying the price adjustment."
        );
        return;
      }
    }

    if (
      (newStatus === "DECLINED_AFTER_INSPECTION" || newStatus === "NO_SHOW") &&
      trimmedNotes.length < 5
    ) {
      setModalError(
        "Please record a brief reason (at least 5 characters) before cancelling or reporting a no-show."
      );
      return;
    }

    const payloadFinalCents =
      newStatus === "DECLINED_AFTER_INSPECTION" || newStatus === "NO_SHOW"
        ? 0
        : newStatus === "APPOINTMENT_CONFIRMED"
          ? undefined
          : parsedCents;

    try {
      const result = await outcomeMutation.mutateAsync({
        matchId: editingMatch.id,
        payload: {
          outcome: newStatus,
          ...(payloadFinalCents !== undefined
            ? { finalPriceCents: payloadFinalCents }
            : {}),
          notes: trimmedNotes,
        },
      });

      setSaveSuccess(result.match.voucherCode);
      setEditingMatch(null);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setModalError(getErrorMessage(err));
    }
  };

  const totalCompletedValueCents =
    data?.summary.totalSettledValueCents ??
    matches
      .filter(
        (m) => m.status === "COMPLETED" || m.status === "RENEGOTIATED_LOWER"
      )
      .reduce(
        (acc, m) =>
          acc + (m.finalTransactionCents ?? m.acceptedBidAmountCents),
        0
      );

  const totalWonValueCents =
    data?.summary.totalWonValueCents ??
    matches.reduce((acc, m) => acc + m.acceptedBidAmountCents, 0);

  const scheduledCount =
    data?.summary.scheduledCount ??
    matches.filter((m) => m.status === "APPOINTMENT_CONFIRMED").length;
  const completedCount =
    data?.summary.completedCount ??
    matches.filter(
      (m) => m.status === "COMPLETED" || m.status === "RENEGOTIATED_LOWER"
    ).length;
  const closedCount = matches.filter(
    (m) =>
      m.status === "DECLINED_AFTER_INSPECTION" ||
      m.status === "NO_SHOW" ||
      m.status === "EXPIRED"
  ).length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Open Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline text-portal-text tracking-tight">
              {t("wonMatchesTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-2xl">
              Coordinate physical vehicle intake, appointment verification, and offline inspection settlements for{" "}
              {data?.dealershipName ?? "your dealership"}.
            </p>
          </div>

          <Link
            href="/dealer/inventory"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold transition-all shadow-2xs self-start lg:self-auto cursor-pointer group"
          >
            <span>{t("exploreFloorCta")}</span>
            <ArrowUpRight className="w-4 h-4 text-portal-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Unified Stats Bar */}
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 shadow-xs">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:divide-x divide-portal-border">
            <div className="min-w-0 lg:pr-6">
              <dt className="text-xs font-semibold text-portal-text-muted uppercase tracking-wider font-mono">
                Total Won Value
              </dt>
              <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-portal-text tracking-tight tabular-nums whitespace-nowrap">
                {formatCadCents(totalWonValueCents)}
              </dd>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Agreed Wholesale Volume</span>
              </div>
            </div>

            <div className="min-w-0 sm:pl-6 lg:px-6">
              <dt className="text-xs font-semibold text-portal-text-muted uppercase tracking-wider font-mono">
                Total Won Lots
              </dt>
              <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-portal-text tracking-tight">
                {matches.length} Lots
              </dd>
              <span className="text-xs text-portal-text-muted mt-1 block">
                Accepted Seller Offers
              </span>
            </div>

            <div className="min-w-0 lg:px-6">
              <dt className="text-xs font-semibold text-portal-text-muted uppercase tracking-wider font-mono">
                Confirmed Intake
              </dt>
              <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-portal-text tracking-tight">
                {scheduledCount} Scheduled
              </dd>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Service Bay Intake</span>
              </div>
            </div>

            <div className="min-w-0 sm:pl-6 lg:pl-6">
              <dt className="text-xs font-semibold text-portal-text-muted uppercase tracking-wider font-mono">
                Settled Handovers
              </dt>
              <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-portal-text tracking-tight tabular-nums whitespace-nowrap">
                {formatCadCents(totalCompletedValueCents)}
              </dd>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{completedCount} Completed Sales</span>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {/* 2. Filter Tabs, Search & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs text-xs self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === "ALL"
                ? "bg-portal-primary text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span>All Won Matches</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filterTab === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {matches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("SCHEDULED")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === "SCHEDULED"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Scheduled Intake</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filterTab === "SCHEDULED"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {scheduledCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled &amp; Paid</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filterTab === "COMPLETED"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {completedCount}
            </span>
          </button>

          {closedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab("CLOSED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterTab === "CLOSED"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Declined / Voided</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  filterTab === "CLOSED"
                    ? "bg-white/20 text-white"
                    : "bg-portal-surface-hover text-portal-text-muted"
                }`}
              >
                {closedCount}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:max-w-md md:justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seller, voucher, VIN, make..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-portal-surface border border-portal-border focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-xs text-portal-text placeholder:text-portal-text-muted shadow-2xs transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-portal-text-muted hover:text-portal-text p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as MatchSortKey)}
              className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-portal-surface border border-portal-border text-xs font-semibold text-portal-text hover:bg-portal-surface-hover shadow-2xs transition-colors cursor-pointer outline-none focus:border-portal-primary"
            >
              <option value="LATEST">Sort: Latest Won</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="MILEAGE">Mileage: Lowest</option>
            </select>
            <ChevronsUpDown className="w-3.5 h-3.5 text-portal-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Inspection outcome recorded on audit trail for voucher #{saveSuccess}.</span>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center justify-between gap-3">
          <span>{getErrorMessage(error)}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Won Match Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center rounded-2xl border border-portal-border bg-portal-surface p-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-portal-primary mx-auto animate-spin" />
            <p className="text-sm font-medium text-portal-text-muted">
              Loading won dealership handovers...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-portal-border bg-portal-surface p-8 space-y-3">
            <Trophy className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-portal-text font-headline">
              No Matching Won Vehicles
            </h3>
            <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
              {searchQuery
                ? `No won vehicles match "${searchQuery}". Try clearing your search.`
                : filterTab !== "ALL"
                  ? "No won lots match your selected filter."
                  : "Once a seller accepts your dealership's sealed offer, their verified contact details and handover voucher will appear here."}
            </p>
            {(searchQuery || filterTab !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setFilterTab("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover text-xs font-medium text-portal-text hover:bg-portal-surface cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isSettled =
              match.status === "COMPLETED" ||
              match.status === "RENEGOTIATED_LOWER";
            const isPendingIntake = match.status === "APPOINTMENT_CONFIRMED";
            const logoPath = CAR_BRAND_LOGOS[match.vehicle.make.toLowerCase()];

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-all shadow-2xs hover:shadow-md relative overflow-hidden group space-y-5"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-portal-border/60">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {renderStatusBadge(match.status)}

                    <span className="text-xs font-mono font-bold text-portal-primary">
                      Voucher #{match.voucherCode}
                    </span>

                    <span className="text-portal-border hidden sm:inline">•</span>

                    <span className="text-xs text-portal-text-muted">
                      Accepted {formatWonAtLabel(match.wonAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                    <div className="text-right pr-2">
                      <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">
                        Agreed Wholesale Price
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-headline text-portal-text block">
                        {formatCadCents(match.acceptedBidAmountCents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQrMatch(match)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text transition-colors shadow-2xs cursor-pointer"
                        title="View printable digital intake pass & QR code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-portal-primary" />
                        <span>Intake Pass QR</span>
                      </button>

                      {isPendingIntake ? (
                        <button
                          type="button"
                          onClick={() => openInspectionModal(match)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-2xs cursor-pointer group/btn"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Log Outcome</span>
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-xs font-semibold text-portal-text-muted">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Outcome Finalized</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-6 flex items-start gap-4">
                    <Link
                      href={`/dealer/auctions/${match.vehicle.auctionId}`}
                      className="relative w-32 h-22 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border group/photo shadow-2xs block"
                    >
                      <Image
                        src={match.vehicle.thumbnailUrl}
                        alt={`${match.vehicle.make} ${match.vehicle.model}`}
                        fill
                        className="object-cover group-hover/photo:scale-105 transition-transform duration-300"
                        sizes="160px"
                      />

                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        Grade {match.vehicle.damageGrade}
                      </div>

                      {logoPath && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center p-0.5">
                          <Image
                            src={logoPath}
                            alt={match.vehicle.make}
                            width={18}
                            height={18}
                            className="object-contain brightness-0 invert opacity-90"
                          />
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-portal-text-muted">
                        <span className="font-mono">
                          VIN: ···{match.vehicle.vin.slice(-6)}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-medium text-portal-text">
                          {match.vehicle.mileageKm.toLocaleString()} km
                        </span>
                      </div>

                      <Link
                        href={`/dealer/auctions/${match.vehicle.auctionId}`}
                        className="text-base sm:text-lg font-bold font-headline text-portal-text hover:text-portal-primary transition-colors block"
                      >
                        {match.vehicle.year} {match.vehicle.make}{" "}
                        {match.vehicle.model}
                      </Link>

                      <p className="text-xs text-portal-text-muted">
                        {match.vehicle.trim}
                      </p>

                      <Link
                        href={`/dealer/auctions/${match.vehicle.auctionId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-portal-primary hover:underline pt-0.5"
                      >
                        <span>View Inspection Dossier</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Unsealed Seller Contact Details */}
                  <div className="lg:col-span-6 space-y-3 sm:border-l border-portal-border/60 sm:pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-portal-text font-headline">
                          {match.seller.name}
                        </span>
                        {match.seller.kycVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>ID Verified</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-portal-text-muted">
                        Registered Private Seller
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 font-mono text-portal-text-muted">
                        <Phone className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                        <a
                          href={`tel:${match.seller.phone.replace(/[^0-9+]/g, "")}`}
                          className="hover:text-portal-text hover:underline transition-colors"
                        >
                          {match.seller.phone}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-portal-text-muted">
                        <Mail className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                        <a
                          href={`mailto:${match.seller.email}`}
                          className="hover:text-portal-text hover:underline truncate transition-colors"
                        >
                          {match.seller.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 text-portal-text-muted">
                        <MapPin className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                        <span>
                          {match.seller.city}, {match.seller.province}
                          {match.seller.postalCode
                            ? ` (${match.seller.postalCode})`
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-portal-text-muted">
                        <Building2 className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                        <span className="truncate">
                          {match.appointmentLocation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Outcome & Notes */}
                <div className="pt-3.5 border-t border-portal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start sm:items-center gap-2 text-portal-text-muted">
                    {isSettled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                    ) : isPendingIntake ? (
                      <Calendar className="w-4 h-4 text-sky-500 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <span className="leading-relaxed">
                      {match.inspectionNotes ||
                        "Appointment confirmed for physical vehicle appraisal."}
                    </span>
                  </div>

                  <div className="text-portal-text-muted text-[11px] shrink-0 font-medium">
                    {isSettled ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span>
                          Final Payout:{" "}
                          {formatCadCents(
                            match.finalTransactionCents ??
                              match.acceptedBidAmountCents
                          )}
                        </span>
                        <span>• Bill of Sale Recorded</span>
                      </span>
                    ) : isPendingIntake ? (
                      <span className="text-portal-text-muted">
                        Appointment Window:{" "}
                        {mounted
                          ? formatWindowRemaining(
                              match.appointmentWindowExpiresAt,
                              effectiveNowMs
                            )
                          : "24h window"}
                      </span>
                    ) : (
                      <span className="text-rose-500 font-semibold">
                        Handover Cancelled • $0 Payout
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Digital QR Voucher Pass Modal */}
      {mounted &&
        selectedQrMatch &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedQrMatch(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="intake-pass-title"
            >
              <button
                type="button"
                onClick={() => setSelectedQrMatch(null)}
                className="absolute top-4 right-4 text-portal-text-muted hover:text-portal-text w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-portal-surface-hover"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-portal-primary/10 text-portal-primary border border-portal-primary/20 uppercase tracking-wide">
                  Dealership Intake Pass
                </span>
                <h3
                  id="intake-pass-title"
                  className="text-xl font-bold font-headline text-portal-text tracking-tight"
                >
                  Voucher #{selectedQrMatch.voucherCode}
                </h3>
                <p className="text-xs text-portal-text-muted font-mono">
                  {selectedQrMatch.vehicle.year}{" "}
                  {selectedQrMatch.vehicle.make}{" "}
                  {selectedQrMatch.vehicle.model} • VIN{" "}
                  {selectedQrMatch.vehicle.vin.slice(-6)}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-portal-border shadow-sm mx-auto w-48 h-48 flex flex-col items-center justify-center space-y-2">
                <QrCode className="w-36 h-36 text-neutral-900" />
              </div>

              <div className="space-y-2 text-xs text-portal-text-muted font-mono bg-portal-surface-hover/50 p-3.5 rounded-xl border border-portal-border text-left">
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">
                    Agreed Winning Bid:
                  </span>
                  <span className="font-bold text-portal-text">
                    {formatCadCents(selectedQrMatch.acceptedBidAmountCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">
                    Registered Seller:
                  </span>
                  <span className="font-semibold text-portal-text">
                    {selectedQrMatch.seller.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">Phone:</span>
                  <span className="text-portal-text">
                    {selectedQrMatch.seller.phone}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-portal-text-muted leading-relaxed">
                Verify voucher code at the dealership intake desk before confirming electronic wire disbursement.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl border border-portal-border hover:bg-portal-surface-hover text-xs font-semibold text-portal-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQrMatch(null)}
                  className="flex-1 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Inspection Outcome & Settlement Modal */}
      {mounted &&
        editingMatch &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => {
              if (!outcomeMutation.isPending) setEditingMatch(null);
            }}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-200 text-portal-text relative max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="settlement-modal-title"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-portal-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-portal-primary/10 text-portal-primary border border-portal-primary/20 uppercase tracking-wide">
                      Dealership Intake &amp; Settlement
                    </span>
                    <span className="text-xs text-portal-text-muted font-mono">
                      #{editingMatch.voucherCode}
                    </span>
                  </div>
                  <h2
                    id="settlement-modal-title"
                    className="text-lg sm:text-xl font-bold font-headline text-portal-text tracking-tight"
                  >
                    Log Inspection &amp; Settlement Outcome
                  </h2>
                  <p className="text-xs text-portal-text-muted">
                    Record hoist inspection findings, adjust final payout if needed, and finalize settlement on the audit trail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!outcomeMutation.isPending) setEditingMatch(null);
                  }}
                  disabled={outcomeMutation.isPending}
                  className="text-portal-text-muted hover:text-portal-text w-8 h-8 rounded-xl border border-transparent hover:border-portal-border hover:bg-portal-surface-hover flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-xl border border-portal-border bg-portal-surface-hover/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-portal-border shrink-0 bg-portal-surface">
                    <Image
                      src={editingMatch.vehicle.thumbnailUrl}
                      alt={editingMatch.vehicle.model}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-portal-text flex items-center gap-2">
                      <span>
                        {editingMatch.vehicle.year} {editingMatch.vehicle.make}{" "}
                        {editingMatch.vehicle.model}
                      </span>
                      <span className="text-[11px] font-normal text-portal-text-muted">
                        ({editingMatch.vehicle.trim})
                      </span>
                    </div>
                    <div className="text-[11px] text-portal-text-muted font-mono flex items-center gap-2 mt-0.5">
                      <span>VIN: {editingMatch.vehicle.vin}</span>
                      <span>•</span>
                      <span>
                        {editingMatch.vehicle.mileageKm.toLocaleString()} km
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-portal-border">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-portal-text-muted block">
                    Agreed Winning Offer
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-portal-primary">
                    {formatCadCents(editingMatch.acceptedBidAmountCents)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveInspection} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                    1. Inspection &amp; Handover Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        {
                          value: "COMPLETED",
                          title: "Inspection Passed (Full Payout)",
                          desc: "Vehicle appraisal verified. Authorize full agreed CAD payout to seller.",
                          icon: CheckCircle2,
                          accent: "text-emerald-500",
                          activeBorder:
                            "border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/20",
                        },
                        {
                          value: "APPOINTMENT_CONFIRMED",
                          title: "Update Intake Notes (Keep Open)",
                          desc: "Save technician note while keeping appointment scheduled.",
                          icon: Calendar,
                          accent: "text-sky-500",
                          activeBorder:
                            "border-sky-500/80 bg-sky-500/5 ring-1 ring-sky-500/20",
                        },
                        {
                          value: "RENEGOTIATED_LOWER",
                          title: "Price Adjusted for Flaws",
                          desc: "Undisclosed mechanical or body flaws found; mutual reduced CAD payout.",
                          icon: AlertTriangle,
                          accent: "text-amber-500",
                          activeBorder:
                            "border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/20",
                        },
                        {
                          value: "NO_SHOW",
                          title: "Seller No-Show",
                          desc: "Seller did not attend within the 24h handover window.",
                          icon: Clock,
                          accent: "text-rose-500",
                          activeBorder:
                            "border-rose-500/80 bg-rose-500/5 ring-1 ring-rose-500/20",
                        },
                        {
                          value: "DECLINED_AFTER_INSPECTION",
                          title: "Declined Dealership Purchase",
                          desc: "Severe undisclosed flaws found on hoist; match voided ($0 payout).",
                          icon: XCircle,
                          accent: "text-rose-500",
                          activeBorder:
                            "border-rose-500/80 bg-rose-500/5 ring-1 ring-rose-500/20",
                        },
                      ] as const
                    ).map((opt) => {
                      const isSelected = newStatus === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectStatus(opt.value)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? opt.activeBorder
                              : "border-portal-border bg-portal-surface hover:bg-portal-surface-hover/70"
                          }`}
                        >
                          <div
                            className={`mt-0.5 p-1 rounded-md shrink-0 ${
                              isSelected ? "bg-portal-surface" : ""
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${opt.accent}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-portal-text block">
                                {opt.title}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-portal-text-muted leading-snug mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {newStatus === "DECLINED_AFTER_INSPECTION" ||
                newStatus === "NO_SHOW" ? (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {newStatus === "NO_SHOW"
                        ? "Handover will be closed as a Seller No-Show ($0 payout) and the listing status will transition back to UNSEALED."
                        : "Dealership purchase declined ($0.00 CAD payout). The listing status will transition back to UNSEALED."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 p-3.5 rounded-xl border border-portal-border bg-portal-surface-hover/30">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                        2. Final Settlement Payout (CAD)
                      </label>
                      {(() => {
                        const originalOffer =
                          editingMatch.acceptedBidAmountCents / 100;
                        const currentVal =
                          parseFloat(finalPriceInput.replace(/[^0-9.]/g, "")) ||
                          0;
                        const diff = currentVal - originalOffer;
                        if (diff === 0) {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              ✓ 100% of Agreed Offer
                            </span>
                          );
                        }
                        if (diff < 0) {
                          const pct = (
                            (Math.abs(diff) / originalOffer) *
                            100
                          ).toFixed(1);
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              ▼ -${Math.abs(diff).toLocaleString()} CAD (-
                              {pct}% deduction)
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            ▲ +${diff.toLocaleString()} CAD
                          </span>
                        );
                      })()}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-portal-text-muted text-sm font-bold">
                        $
                      </span>
                      <input
                        type="text"
                        value={finalPriceInput}
                        disabled={newStatus === "APPOINTMENT_CONFIRMED"}
                        onChange={(e) => setFinalPriceInput(e.target.value)}
                        placeholder={(
                          editingMatch.acceptedBidAmountCents / 100
                        ).toString()}
                        className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text font-mono text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-portal-primary disabled:opacity-60"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-portal-text-muted text-xs">
                        CAD
                      </span>
                    </div>

                    {newStatus === "RENEGOTIATED_LOWER" && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-portal-text-muted font-mono mr-1">
                          Quick Deduction:
                        </span>
                        {[
                          {
                            label: `Agreed (${formatCadCents(editingMatch.acceptedBidAmountCents)})`,
                            delta: 0,
                          },
                          { label: "-$500", delta: -500 },
                          { label: "-$1,000", delta: -1000 },
                          { label: "-$1,500", delta: -1500 },
                          { label: "-$2,500", delta: -2500 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => handleApplyPriceDelta(btn.delta)}
                            className="px-2 py-1 rounded-lg border border-portal-border hover:border-portal-primary hover:bg-portal-surface text-[10px] font-mono text-portal-text transition-all cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                      3. Technician / Hoist Inspection Notes &amp; Rationale
                    </label>
                    <span className="text-[10px] text-portal-text-muted font-mono">
                      Recorded on Settlement Audit Log
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Physical hoist inspection completed at service bay. Underbody clean, OBD-II scan shows 0 trouble codes. Bill of Sale signed."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary leading-relaxed resize-none"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-portal-text-muted font-mono mr-1">
                      Insert findings:
                    </span>
                    {[
                      "Hoist check complete",
                      "OBD-II scan 0 DTCs",
                      "Paint depth verified",
                      "Brake wear matched photos",
                      "Both key fobs received",
                      "Bill of Sale signed",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddQuickTag(tag)}
                        className="px-2 py-0.5 rounded-md border border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover hover:border-portal-border text-[10px] text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {modalError && (
                  <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                    {modalError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-portal-border">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    disabled={outcomeMutation.isPending}
                    className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-semibold text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={outcomeMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {outcomeMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Outcome...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Settlement Record</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
