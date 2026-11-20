"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  getAdminAnalyticsCsvUrl,
  useAdminAnalytics,
} from "@/hooks/useAdminAnalytics";
import type {
  AnalyticsTimeRange,
  ProvincialMarketShare,
  WholesaleSettlementRecord,
} from "@/lib/types/admin";
import { formatCadCents } from "@/lib/utils";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

const emptySubscribe = () => () => {};

const EMPTY_PROVINCES: ProvincialMarketShare[] = [];
const EMPTY_SETTLEMENTS: WholesaleSettlementRecord[] = [];

function getProvinceThemeColor(code: string): string {
  switch (code) {
    case "ON":
      return "var(--color-secondary)";
    case "AB":
      return "var(--color-primary)";
    case "BC":
      return "var(--color-badge-vsa)";
    case "QC":
      return "var(--color-badge-amvic)";
    default:
      return "var(--color-brand-electric)";
  }
}

export function AdminAnalyticsView() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30D");
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [activeMetricTab, setActiveMetricTab] = useState<
    "VOLUME" | "BIDS" | "CLEARANCE"
  >("VOLUME");
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(
    null
  );
  const [hoveredProvinceCode, setHoveredProvinceCode] = useState<string | null>(
    null
  );
  const [hoveredCityIndex, setHoveredCityIndex] = useState<number | null>(null);
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<
    "ALL" | "SETTLED" | "ESCROW_CLEARED"
  >("ALL");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const pageSize = 5;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminAnalytics({
      range: timeRange,
      province: selectedProvince,
    });

  const kpis = data?.kpis ?? {
    totalVolumeCents: 0,
    previousVolumeCents: 0,
    gmvGrowthPercent: 0,
    totalTransactionsCount: 0,
    totalListingsCount: 0,
    eligibleClosedListingsCount: 0,
    clearedLotsCount: 0,
    clearanceRatePercent: 0,
    averageBidsPerLot: 0,
    averageSellerSurplusCents: 0,
    activeDealerCount: 0,
    activeAuctionsCount: 0,
    totalBidsCount: 0,
  };

  const trendData = useMemo(() => data?.trend ?? [], [data?.trend]);
  const provincialData = data?.provincialShare ?? EMPTY_PROVINCES;
  const metroVelocity = useMemo(
    () => data?.metroVelocity ?? [],
    [data?.metroVelocity]
  );
  const dealerLeaderboard = data?.dealerLeaderboard ?? [];
  const settlements = data?.settlements ?? EMPTY_SETTLEMENTS;

  // Chart Curve Math
  const chartW = 680;
  const chartH = 200;
  const paddingX = 40;
  const paddingY = 25;

  const primarySeriesMax = useMemo(() => {
    if (trendData.length === 0) return 0;
    const values = trendData.flatMap((pt) => {
      if (activeMetricTab === "VOLUME") {
        return [pt.volumeCents, pt.reserveFloorCents];
      }
      if (activeMetricTab === "BIDS") {
        return [pt.bidsCount];
      }
      return [pt.lotsCleared];
    });
    return Math.max(0, ...values);
  }, [trendData, activeMetricTab]);

  const points = useMemo(() => {
    if (trendData.length === 0) return [];
    const safeDenom = Math.max(1, primarySeriesMax);
    const baselineY = chartH - paddingY;
    const spanY = chartH - paddingY * 2;
    const count = trendData.length;

    return trendData.map((pt, idx) => {
      const x =
        count === 1
          ? chartW / 2
          : paddingX + (idx / (count - 1)) * (chartW - paddingX * 2);
      const rawValue =
        activeMetricTab === "VOLUME"
          ? pt.volumeCents
          : activeMetricTab === "BIDS"
          ? pt.bidsCount
          : pt.lotsCleared;
      const normalizedY = primarySeriesMax > 0 ? rawValue / safeDenom : 0;
      const y = baselineY - normalizedY * spanY;
      return { x, y, pt, value: rawValue };
    });
  }, [trendData, primarySeriesMax, activeMetricTab]);

  const reservePoints = useMemo(() => {
    if (trendData.length === 0 || activeMetricTab !== "VOLUME") return [];
    const safeDenom = Math.max(1, primarySeriesMax);
    const baselineY = chartH - paddingY;
    const spanY = chartH - paddingY * 2;
    const count = trendData.length;

    return trendData.map((pt, idx) => {
      const x =
        count === 1
          ? chartW / 2
          : paddingX + (idx / (count - 1)) * (chartW - paddingX * 2);
      const normalizedY =
        primarySeriesMax > 0 ? pt.reserveFloorCents / safeDenom : 0;
      const y = baselineY - normalizedY * spanY;
      return { x, y, pt };
    });
  }, [trendData, primarySeriesMax, activeMetricTab]);

  const generateCurvedPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const volumePathD = useMemo(() => generateCurvedPath(points), [points]);
  const reservePathD = useMemo(
    () => generateCurvedPath(reservePoints),
    [reservePoints]
  );

  const areaPathD = useMemo(() => {
    if (points.length < 2) return "";
    const linePath = generateCurvedPath(points);
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    return `${linePath} L ${lastX} ${chartH} L ${firstX} ${chartH} Z`;
  }, [points]);

  const effectiveHoverIndex =
    points.length === 0
      ? null
      : hoveredTrendIndex !== null && hoveredTrendIndex < points.length
      ? hoveredTrendIndex
      : points.length - 1;

  // Donut Arc Calculations
  const donutR = 64;
  const circumference = 2 * Math.PI * donutR;

  const donutSlices = useMemo(() => {
    return provincialData.map((prov, idx) => {
      const pct = Math.max(0, prov.sharePercent);
      const startPercent = provincialData
        .slice(0, idx)
        .reduce((sum, prev) => sum + Math.max(0, prev.sharePercent), 0);
      const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((startPercent / 100) * circumference);
      return {
        ...prov,
        color: getProvinceThemeColor(prov.code),
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [provincialData, circumference]);

  const activeDonutProvince = useMemo(() => {
    if (hoveredProvinceCode) {
      const match = donutSlices.find((p) => p.code === hoveredProvinceCode);
      if (match) return match;
    }
    const nonZeroTop = [...donutSlices].sort(
      (a, b) => b.volumeCents - a.volumeCents
    )[0];
    return (
      nonZeroTop ?? {
        province: "Canada",
        code: "ALL",
        regulator: "OMVIC",
        volumeCents: 0,
        sharePercent: 0,
        dealersCount: 0,
        lotsCount: 0,
        clearedLotsCount: 0,
        avgSurplusCents: 0,
        color: "var(--color-secondary)",
        strokeDasharray: `0 ${circumference}`,
        strokeDashoffset: 0,
      }
    );
  }, [donutSlices, hoveredProvinceCode, circumference]);

  // Metro stats
  const maxCityLots = useMemo(
    () => Math.max(1, ...metroVelocity.map((m) => m.intakeLots)),
    [metroVelocity]
  );
  const totalIntakeLots = useMemo(
    () => metroVelocity.reduce((sum, m) => sum + m.intakeLots, 0),
    [metroVelocity]
  );
  const peakHub = useMemo(() => {
    if (metroVelocity.length === 0) return null;
    return [...metroVelocity].sort(
      (a, b) =>
        b.clearancePercent - a.clearancePercent || b.clearedLots - a.clearedLots
    )[0];
  }, [metroVelocity]);

  // Settlement Table filtering and sorting
  const filteredRecords = useMemo(() => {
    const q = searchTableQuery.toLowerCase().trim();
    return settlements.filter((rec) => {
      const matchesSearch =
        q.length === 0 ||
        rec.vehicle.toLowerCase().includes(q) ||
        rec.buyer.toLowerCase().includes(q) ||
        rec.vin.toLowerCase().includes(q) ||
        rec.voucherCode.toLowerCase().includes(q);
      const matchesStatus =
        tableStatusFilter === "ALL" || rec.status === tableStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchTableQuery, tableStatusFilter]);

  const { sortedData, requestSort, isSorted } = useTableSort(filteredRecords);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const handleSelectAllRows = () => {
    if (paginatedRecords.length === 0) return;
    const allSelected = paginatedRecords.every((r) => selectedRows.has(r.id));
    const next = new Set(selectedRows);
    if (allSelected) {
      paginatedRecords.forEach((r) => next.delete(r.id));
    } else {
      paginatedRecords.forEach((r) => next.add(r.id));
    }
    setSelectedRows(next);
  };

  const handleCopyVin = (vin: string) => {
    void navigator.clipboard.writeText(vin);
    setCopiedId(vin);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const downloadUrl = getAdminAnalyticsCsvUrl({
      range: timeRange,
      province: selectedProvince,
    });
    setExportNotice(
      `Downloading Canadian Wholesale Analytics CSV (${timeRange}, ${selectedProvince})...`
    );
    window.location.assign(downloadUrl);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const formatSettlementTimestamp = (iso: string) => {
    if (!mounted) return "—";
    const dt = new Date(iso);
    return dt.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalVerifiedDealersDonut = provincialData.reduce(
    (acc, p) => acc + p.dealersCount,
    0
  );

  return (
    <div className="space-y-6 pb-20 font-body">
      {/* 1. Executive Intelligence Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            Platform Analytics &amp; Wholesale Volume
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl">
            Live Gross Merchandise Value (GMV), sealed-bid velocity, regional quota distribution, and verifiable PostgreSQL settlement feeds.
          </p>
        </div>

        {/* Global Controls & Timeframe Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Segmented Control */}
          <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs text-xs font-semibold">
            {(["7D", "30D", "90D", "YTD"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  setHoveredTrendIndex(null);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-portal-primary text-white font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                }`}
              >
                {range === "7D"
                  ? "Last 7 Days"
                  : range === "30D"
                  ? "30 Days"
                  : range === "90D"
                  ? "90 Days"
                  : "YTD"}
              </button>
            ))}
          </div>

          {/* Provincial Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setHoveredProvinceCode(null);
                setCurrentPage(1);
              }}
              aria-label="Filter by jurisdiction"
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-portal-surface border border-portal-border text-xs font-semibold text-portal-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-portal-primary/40 shadow-2xs"
            >
              <option value="ALL">All Jurisdictions</option>
              <option value="ON">Ontario (OMVIC)</option>
              <option value="AB">Alberta (AMVIC)</option>
              <option value="BC">British Columbia (VSA)</option>
              <option value="QC">Quebec (OPC)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-portal-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-portal-text text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh live analytics"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-portal-text-muted ${
                isFetching ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoading || isError}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-portal-text font-bold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-portal-text-muted" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Export Toast Banner */}
      {exportNotice && (
        <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error instanceof ApiError
                ? error.message
                : "Failed to load live platform analytics from Supabase."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold cursor-pointer self-start sm:self-auto"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Initial Loading Indicator */}
      {isLoading && !data && (
        <div className="p-10 rounded-2xl border border-portal-border bg-portal-surface flex items-center justify-center gap-3 text-sm text-portal-text-muted">
          <Loader2 className="w-5 h-5 animate-spin text-portal-primary" />
          <span>Aggregating live PostgreSQL analytics views...</span>
        </div>
      )}

      {/* 2. Unified Top Metrics Ribbon */}
      <div className="border border-portal-border rounded-2xl bg-portal-surface shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-portal-border/60 overflow-hidden">
        {/* Metric 1: GMV */}
        <div className="p-6 flex items-center justify-between gap-4 hover:bg-portal-surface-hover/30 transition-colors">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-portal-text-muted uppercase tracking-wider block mb-1">
              Gross Merchandise Value
            </span>
            <span className="font-headline text-2xl sm:text-3xl font-black text-portal-text tracking-tight block">
              {formatCadCents(kpis.totalVolumeCents)}
            </span>
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold mt-1 ${
                kpis.gmvGrowthPercent >= 0
                  ? "text-emerald-500"
                  : "text-amber-500"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {kpis.gmvGrowthPercent > 0 ? "+" : ""}
                {kpis.gmvGrowthPercent}% vs prior period
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Transactions */}
        <div className="p-6 flex items-center justify-between gap-4 hover:bg-portal-surface-hover/30 transition-colors">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-portal-text-muted uppercase tracking-wider block mb-1">
              Total Transactions
            </span>
            <span className="font-headline text-2xl sm:text-3xl font-black text-portal-text tracking-tight block">
              {kpis.totalTransactionsCount}
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              Avg Surplus {formatCadCents(kpis.averageSellerSurplusCents)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Completed Clearance */}
        <div className="p-6 flex items-center justify-between gap-4 hover:bg-portal-surface-hover/30 transition-colors">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-portal-text-muted uppercase tracking-wider block mb-1">
              Completed Clearance
            </span>
            <span className="font-headline text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block">
              {kpis.clearanceRatePercent}%
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              {kpis.clearedLotsCount} of {kpis.eligibleClosedListingsCount}{" "}
              Reserve Floors Met
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Bidding Velocity */}
        <div className="p-6 flex items-center justify-between gap-4 hover:bg-portal-surface-hover/30 transition-colors">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-portal-text-muted uppercase tracking-wider block mb-1">
              Bidding Velocity
            </span>
            <span className="font-headline text-2xl sm:text-3xl font-black text-amber-500 tracking-tight block">
              {kpis.averageBidsPerLot}{" "}
              <span className="text-sm font-semibold text-portal-text-muted">
                bids/lot
              </span>
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              Across {kpis.activeDealerCount} Licensed Groups
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Hero Charts: Expansive Revenue Spline Curve & Regional Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Spline Curve Chart (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-portal-border/60">
            <div>
              <h2 className="text-lg font-bold text-portal-text font-headline">
                Wholesale Liquidity &amp; Revenue Volume
              </h2>
              <p className="text-xs text-portal-text-muted mt-0.5 font-body">
                Tracking settled transaction volume versus reserve floor targets across {kpis.totalBidsCount} sealed bids.
              </p>
            </div>

            {/* Metric Mode Chips */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMetricTab("VOLUME")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === "VOLUME"
                    ? "bg-portal-surface text-portal-text shadow-2xs font-bold"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Volume (CAD)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab("BIDS")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === "BIDS"
                    ? "bg-portal-surface text-portal-text shadow-2xs font-bold"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Bids Count
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab("CLEARANCE")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === "CLEARANCE"
                    ? "bg-portal-surface text-portal-text shadow-2xs font-bold"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Lots Cleared
              </button>
            </div>
          </div>

          {/* Clean SVG Spline Chart */}
          <div className="relative my-4 w-full h-[230px]">
            <div className="absolute top-2 right-4 z-10 flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-secondary" />
                <span className="text-portal-text font-semibold">
                  {activeMetricTab === "VOLUME"
                    ? "Settled GMV"
                    : activeMetricTab === "BIDS"
                    ? "Bids Placed"
                    : "Lots Cleared"}
                </span>
              </div>
              {activeMetricTab === "VOLUME" && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full bg-portal-text-muted/50" />
                  <span className="text-portal-text-muted">Reserve Floor</span>
                </div>
              )}
            </div>

            {primarySeriesMax === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="px-3 py-1.5 rounded-lg bg-portal-surface-hover/80 border border-portal-border text-[11px] font-mono text-portal-text-muted">
                  No settled {activeMetricTab.toLowerCase()} activity in this window yet
                </span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="autonexaAmberGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-secondary)"
                    stopOpacity="0.22"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-secondary)"
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const y = paddingY + ratio * (chartH - paddingY * 2);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={chartW - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-portal-border/40"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {areaPathD && (
                <path d={areaPathD} fill="url(#autonexaAmberGradient)" />
              )}

              {activeMetricTab === "VOLUME" && reservePathD && (
                <path
                  d={reservePathD}
                  fill="none"
                  stroke="currentColor"
                  className="text-portal-text-muted/60"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {volumePathD && (
                <path
                  d={volumePathD}
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="drop-shadow-sm"
                />
              )}

              {effectiveHoverIndex !== null && points[effectiveHoverIndex] && (
                <g>
                  <line
                    x1={points[effectiveHoverIndex].x}
                    y1={paddingY}
                    x2={points[effectiveHoverIndex].x}
                    y2={chartH - paddingY}
                    stroke="var(--color-secondary)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={points[effectiveHoverIndex].x}
                    cy={points[effectiveHoverIndex].y}
                    r="6"
                    className="fill-portal-surface"
                    stroke="var(--color-secondary)"
                    strokeWidth="3"
                  />
                  <circle
                    cx={points[effectiveHoverIndex].x}
                    cy={points[effectiveHoverIndex].y}
                    r="2.5"
                    fill="var(--color-secondary)"
                  />
                </g>
              )}

              {points.map((pt, idx) => (
                <rect
                  key={pt.pt.bucketStart}
                  x={pt.x - 25}
                  y={0}
                  width="50"
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTrendIndex(idx)}
                />
              ))}
            </svg>

            {/* Floating Sleek Tooltip */}
            {effectiveHoverIndex !== null && points[effectiveHoverIndex] && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(points[effectiveHoverIndex].x / chartW) * 100}%`,
                  top: `${Math.max(
                    18,
                    (points[effectiveHoverIndex].y / chartH) * 100 - 8
                  )}%`,
                }}
              >
                <div className="bg-portal-surface border border-portal-border p-2.5 rounded-xl shadow-xl text-xs space-y-1 min-w-[160px]">
                  <div className="flex items-center justify-between text-[10px] text-portal-text-muted font-mono font-bold">
                    <span>{points[effectiveHoverIndex].pt.dateStr}</span>
                    <span>{points[effectiveHoverIndex].pt.day}</span>
                  </div>
                  <div className="font-headline font-black text-sm text-portal-text">
                    {activeMetricTab === "VOLUME"
                      ? formatCadCents(points[effectiveHoverIndex].pt.volumeCents)
                      : activeMetricTab === "BIDS"
                      ? `${points[effectiveHoverIndex].pt.bidsCount} Sealed Bids`
                      : `${points[effectiveHoverIndex].pt.lotsCleared} Lots Cleared`}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-portal-text-muted pt-1 border-t border-portal-border/60">
                    <span>
                      {points[effectiveHoverIndex].pt.lotsCleared} Cleared
                    </span>
                    <span className="font-mono text-emerald-500 font-bold">
                      {points[effectiveHoverIndex].pt.bidsCount} Bids
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* X-Axis Bucket Labels */}
          <div className="flex items-center justify-between px-4 pt-2 text-xs font-mono text-portal-text-muted border-t border-portal-border/60 overflow-x-auto gap-2">
            {trendData.map((d, idx) => (
              <button
                key={d.bucketStart}
                type="button"
                onClick={() => setHoveredTrendIndex(idx)}
                className={`font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  effectiveHoverIndex === idx
                    ? "text-amber-500 font-bold"
                    : "hover:text-portal-text"
                }`}
              >
                {d.day}{" "}
                <span className="text-[10px] opacity-70">({d.dateStr})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provincial Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
              <h3 className="text-base font-bold text-portal-text font-headline">
                Provincial Market Share
              </h3>
              <span className="text-xs font-mono text-portal-text-muted">
                {totalVerifiedDealersDonut} Dealers
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1.5 font-body">
              Canadian wholesale clearing volume by registrar jurisdiction.
            </p>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="transform -rotate-90"
            >
              <circle
                cx="100"
                cy="100"
                r={donutR}
                fill="transparent"
                stroke="var(--portal-border)"
                strokeWidth="20"
                opacity="0.35"
              />
              {donutSlices
                .filter((prov) => prov.sharePercent > 0)
                .map((prov) => {
                  const isHovered = hoveredProvinceCode === prov.code;
                  return (
                    <circle
                      key={prov.code}
                      cx="100"
                      cy="100"
                      r={donutR}
                      fill="transparent"
                      stroke={prov.color}
                      strokeWidth={isHovered ? "26" : "20"}
                      strokeDasharray={prov.strokeDasharray}
                      strokeDashoffset={prov.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer hover:opacity-90"
                      onMouseEnter={() => setHoveredProvinceCode(prov.code)}
                      onMouseLeave={() => setHoveredProvinceCode(null)}
                    />
                  );
                })}
            </svg>

            {/* Centered Donut KPI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-mono uppercase tracking-wider text-portal-text-muted">
                {activeDonutProvince.province}
              </span>
              <span className="font-headline text-2xl font-black text-portal-text tracking-tight mt-0.5">
                {activeDonutProvince.sharePercent}%
              </span>
              <span className="text-xs font-semibold text-portal-text-muted font-mono">
                {formatCadCents(activeDonutProvince.volumeCents)}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 pt-2 border-t border-portal-border/60">
            {donutSlices.map((prov) => {
              const active = activeDonutProvince.code === prov.code;
              return (
                <div
                  key={prov.code}
                  onMouseEnter={() => setHoveredProvinceCode(prov.code)}
                  onMouseLeave={() => setHoveredProvinceCode(null)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                    active
                      ? "bg-portal-surface-hover font-semibold"
                      : "hover:bg-portal-surface-hover/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: prov.color }}
                    />
                    <span className="text-portal-text truncate">
                      {prov.province} ({prov.regulator})
                    </span>
                  </div>
                  <span className="font-mono text-portal-text-muted shrink-0">
                    {prov.sharePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Regional Sourcing Intake Velocity Bar Chart & Dealership Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Metropolitan Consignment Velocity (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
              <h3 className="text-base font-bold text-portal-text font-headline">
                Metropolitan Intake &amp; Clearance Velocity
              </h3>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-portal-text-muted/40" />
                  <span className="text-portal-text-muted">Intake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-portal-text">Cleared</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-portal-text-muted mt-1.5 font-body">
              Comparing incoming vehicle consignments with completed dealer clearances by major Canadian metro hub.
            </p>
          </div>

          {metroVelocity.length === 0 ? (
            <div className="my-8 py-10 text-center text-xs text-portal-text-muted border border-dashed border-portal-border rounded-xl">
              No metropolitan auction lots recorded in this filter window.
            </div>
          ) : (
            <div className="my-4 pt-2 flex items-stretch gap-2.5">
              {/* Dedicated Left Y-Axis Scale */}
              <div className="w-12 h-[135px] flex flex-col justify-between items-end pr-1 text-[10px] font-mono text-portal-text-muted shrink-0 select-none">
                <span>{maxCityLots} lots</span>
                <span>{Math.round(maxCityLots * 0.66)} lots</span>
                <span>{Math.round(maxCityLots * 0.33)} lots</span>
                <span>0</span>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-x-0 top-0 h-[135px] flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-portal-border/60 w-full" />
                  <div className="border-b border-dashed border-portal-border/60 w-full" />
                  <div className="border-b border-dashed border-portal-border/60 w-full" />
                  <div className="border-b border-portal-border w-full" />
                </div>

                <div
                  className="grid gap-2 sm:gap-4 items-end h-[175px] relative z-10"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      1,
                      metroVelocity.length
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {metroVelocity.map((hub, idx) => {
                    const barAreaHeight = 135;
                    const intakePx = Math.max(
                      4,
                      Math.round((hub.intakeLots / maxCityLots) * barAreaHeight)
                    );
                    const clearedPx =
                      hub.clearedLots > 0
                        ? Math.max(
                            4,
                            Math.round(
                              (hub.clearedLots / maxCityLots) * barAreaHeight
                            )
                          )
                        : 0;
                    const isHovered = hoveredCityIndex === idx;

                    return (
                      <div
                        key={`${hub.city}-${hub.provinceCode}`}
                        className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredCityIndex(idx)}
                        onMouseLeave={() => setHoveredCityIndex(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-12 z-30 px-2.5 py-1 rounded-lg bg-portal-surface border border-portal-border shadow-lg text-center whitespace-nowrap animate-fadeIn pointer-events-none">
                            <div className="text-[10px] font-bold text-portal-text font-headline">
                              {hub.city} •{" "}
                              <span className="text-amber-500 font-mono">
                                {hub.clearancePercent}%
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-portal-text-muted">
                              {hub.clearedLots} cleared / {hub.intakeLots}{" "}
                              intake
                            </div>
                          </div>
                        )}

                        <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full pb-1">
                          <div
                            className="w-2.5 sm:w-3.5 rounded-t-sm bg-portal-text-muted/30 transition-all duration-300 group-hover:bg-portal-text-muted/50"
                            style={{ height: `${intakePx}px` }}
                            title={`Intake: ${hub.intakeLots} lots`}
                          />
                          <div
                            className="w-2.5 sm:w-3.5 rounded-t-sm bg-amber-500 transition-all duration-300 group-hover:bg-amber-400 group-hover:brightness-110 shadow-2xs"
                            style={{ height: `${clearedPx}px` }}
                            title={`Cleared: ${hub.clearedLots} lots`}
                          />
                        </div>

                        <div className="text-center pt-1.5 border-t border-portal-border/40 w-full">
                          <span className="text-[11px] sm:text-xs font-bold text-portal-text block truncate">
                            {hub.city}
                          </span>
                          <span className="text-[10px] text-portal-text-muted font-mono block">
                            {hub.provinceCode}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-portal-border/60 flex items-center justify-between text-xs font-mono text-portal-text-muted">
            <span>
              Peak Clearance:{" "}
              <strong className="text-portal-text">
                {peakHub
                  ? `${peakHub.city}, ${peakHub.provinceCode} (${peakHub.clearancePercent}%)`
                  : "N/A"}
              </strong>
            </span>
            <span>
              Total Intake:{" "}
              <strong className="text-portal-text">
                {totalIntakeLots} lots
              </strong>
            </span>
          </div>
        </div>

        {/* Top Dealership Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
            <div>
              <h3 className="text-base font-bold text-portal-text font-headline">
                Top Sourcing Dealerships
              </h3>
              <p className="text-xs text-portal-text-muted mt-0.5 font-body">
                Highest auction clearance by volume (CAD)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
              Ranked
            </span>
          </div>

          {dealerLeaderboard.length === 0 ? (
            <div className="py-10 text-center text-xs text-portal-text-muted">
              No verified dealerships found in selected jurisdiction.
            </div>
          ) : (
            <div className="divide-y divide-portal-border/50">
              {dealerLeaderboard.map((dealer) => (
                <div
                  key={dealer.dealershipId}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-portal-surface-hover border border-portal-border flex items-center justify-center font-headline font-bold text-xs text-portal-text shrink-0 group-hover:border-portal-primary/50 transition-colors">
                      {dealer.monogram || "DL"}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-portal-text truncate block group-hover:text-portal-primary transition-colors">
                        {dealer.name}
                      </span>
                      <span className="text-[11px] text-portal-text-muted block truncate font-mono">
                        {dealer.lotsWon} lots won • {dealer.bidsPlaced} bids •{" "}
                        {dealer.province}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-headline font-bold text-xs text-portal-text">
                      {formatCadCents(dealer.volumeCents)}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-500 inline-flex items-center gap-0.5">
                      {dealer.growthPercent > 0 ? "+" : ""}
                      {dealer.growthPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Wholesale Settlement Ledger Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        <div className="p-6 border-b border-portal-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-portal-text font-headline">
                Wholesale Settlement Ledger
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {filteredRecords.length} Records
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Verifiable ledger of completed wholesale settlements, negotiated arbitration payouts, and seller reserve surpluses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicle, dealer, VIN..."
                value={searchTableQuery}
                onChange={(e) => {
                  setSearchTableQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-body"
              />
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs font-semibold">
              {(["ALL", "SETTLED", "ESCROW_CLEARED"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setTableStatusFilter(filter);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    tableStatusFilter === filter
                      ? "bg-portal-surface text-portal-text shadow-2xs font-bold"
                      : "text-portal-text-muted hover:text-portal-text"
                  }`}
                >
                  {filter === "ALL"
                    ? "All"
                    : filter === "SETTLED"
                    ? "Settled"
                    : "Escrow Paid"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body">
            <thead>
              <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30 text-portal-text-muted">
                <th className="py-3.5 pl-6 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRecords.length > 0 &&
                      paginatedRecords.every((r) => selectedRows.has(r.id))
                    }
                    onChange={handleSelectAllRows}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </th>
                <SortableHeader
                  label="Vehicle Lot"
                  direction={isSorted("vehicle")}
                  onSort={() => requestSort("vehicle")}
                />
                <SortableHeader
                  label="Purchasing Dealer"
                  direction={isSorted("buyer")}
                  onSort={() => requestSort("buyer")}
                />
                <SortableHeader
                  label="Amount (CAD)"
                  direction={isSorted("amountCents")}
                  onSort={() => requestSort("amountCents")}
                />
                <SortableHeader
                  label="Seller Surplus"
                  direction={isSorted("surplusCents")}
                  onSort={() => requestSort("surplusCents")}
                />
                <SortableHeader
                  label="Status"
                  direction={isSorted("status")}
                  onSort={() => requestSort("status")}
                />
                <th className="py-3.5 pr-6 pl-4 text-right font-semibold text-portal-text-muted">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/40">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const isChecked = selectedRows.has(rec.id);
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rec.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 text-portal-primary">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-portal-text text-sm block group-hover:text-portal-primary transition-colors">
                              {rec.vehicle}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-portal-text-muted font-mono mt-0.5">
                              <span>VIN ···{rec.vin.slice(-6)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyVin(rec.vin)}
                                className="hover:text-portal-text cursor-pointer p-0.5"
                                title="Copy VIN"
                              >
                                {copiedId === rec.vin ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-portal-text block">
                          {rec.buyer}
                        </span>
                        <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                          {rec.regulator}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-headline font-bold text-sm text-portal-text">
                        {formatCadCents(rec.amountCents)}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCadCents(rec.surplusCents)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            rec.status === "ESCROW_CLEARED"
                              ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rec.status === "ESCROW_CLEARED"
                                ? "bg-indigo-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span>
                            {rec.status === "ESCROW_CLEARED"
                              ? "Escrow Cleared"
                              : "Settled"}
                          </span>
                        </span>
                      </td>

                      <td className="py-4 pr-6 pl-4 text-right text-portal-text-muted font-mono text-xs">
                        {formatSettlementTimestamp(rec.completedAtIso)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-portal-text-muted"
                  >
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">
                      {settlements.length === 0
                        ? "No completed vehicle settlements recorded in this period yet"
                        : "No settlements match your search query"}
                    </p>
                    {(searchTableQuery || tableStatusFilter !== "ALL") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTableQuery("");
                          setTableStatusFilter("ALL");
                          setCurrentPage(1);
                        }}
                        className="text-xs font-semibold text-portal-primary mt-1 hover:underline cursor-pointer"
                      >
                        Clear search filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={safePage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
