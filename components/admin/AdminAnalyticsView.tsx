"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Gavel,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Filter,
  Layers,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  Car,
  Shield,
  Activity,
  CreditCard,
  PieChart as PieChartIcon,
  Check,
  Copy,
  Receipt,
  FileText,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

// --- Mock Datasets for Canadian Wholesale Analytics ---

interface DailyTrendPoint {
  day: string;
  dateStr: string;
  volumeCents: number; // CAD Cents
  bidsCount: number;
  lotsCleared: number;
  reserveFloorCents: number;
}

const TREND_DATA_7D: DailyTrendPoint[] = [
  { day: "Mon", dateStr: "Oct 20", volumeCents: 185000000, bidsCount: 142, lotsCleared: 42, reserveFloorCents: 172000000 },
  { day: "Tue", dateStr: "Oct 21", volumeCents: 212000000, bidsCount: 168, lotsCleared: 49, reserveFloorCents: 198000000 },
  { day: "Wed", dateStr: "Oct 22", volumeCents: 194000000, bidsCount: 155, lotsCleared: 44, reserveFloorCents: 182000000 },
  { day: "Thu", dateStr: "Oct 23", volumeCents: 248000000, bidsCount: 195, lotsCleared: 58, reserveFloorCents: 230000000 },
  { day: "Fri", dateStr: "Oct 24", volumeCents: 285000000, bidsCount: 224, lotsCleared: 64, reserveFloorCents: 265000000 },
  { day: "Sat", dateStr: "Oct 25", volumeCents: 162000000, bidsCount: 128, lotsCleared: 36, reserveFloorCents: 154000000 },
  { day: "Sun", dateStr: "Oct 26", volumeCents: 196050000, bidsCount: 154, lotsCleared: 45, reserveFloorCents: 186000000 },
];

interface ProvincialMarketShare {
  province: string;
  code: string;
  regulator: "OMVIC" | "AMVIC" | "VSA" | "OPC";
  volumeCents: number;
  sharePercent: number;
  dealersCount: number;
  lotsCount: number;
  avgSurplusCents: number;
  color: string;
}

const PROVINCIAL_DATA: ProvincialMarketShare[] = [
  {
    province: "Ontario",
    code: "ON",
    regulator: "OMVIC",
    volumeCents: 894000000, // $8.94M
    sharePercent: 60.3,
    dealersCount: 88,
    lotsCount: 312,
    avgSurplusCents: 285000,
    color: "#E59344", // AutoNexa Honey Amber
  },
  {
    province: "Alberta",
    code: "AB",
    regulator: "AMVIC",
    volumeCents: 312000000, // $3.12M
    sharePercent: 21.1,
    dealersCount: 29,
    lotsCount: 104,
    avgSurplusCents: 245000,
    color: "#8C383E", // AutoNexa Autumn Wine
  },
  {
    province: "British Columbia",
    code: "BC",
    regulator: "VSA",
    volumeCents: 178000000, // $1.78M
    sharePercent: 12.0,
    dealersCount: 16,
    lotsCount: 62,
    avgSurplusCents: 262000,
    color: "#10B981", // Emerald
  },
  {
    province: "Quebec",
    code: "QC",
    regulator: "OPC",
    volumeCents: 98050000, // $980.5K
    sharePercent: 6.6,
    dealersCount: 9,
    lotsCount: 38,
    avgSurplusCents: 210000,
    color: "#64748B", // Slate
  },
];

interface CityVolumeBar {
  city: string;
  provinceCode: string;
  intakeLots: number;
  clearedLots: number;
  clearancePercent: number;
}

const CITY_VOLUME_BARS: CityVolumeBar[] = [
  { city: "Toronto", provinceCode: "ON", intakeLots: 68, clearedLots: 62, clearancePercent: 91.2 },
  { city: "Calgary", provinceCode: "AB", intakeLots: 42, clearedLots: 38, clearancePercent: 90.5 },
  { city: "Vancouver", provinceCode: "BC", intakeLots: 35, clearedLots: 31, clearancePercent: 88.6 },
  { city: "Montreal", provinceCode: "QC", intakeLots: 28, clearedLots: 24, clearancePercent: 85.7 },
  { city: "Ottawa", provinceCode: "ON", intakeLots: 32, clearedLots: 29, clearancePercent: 90.6 },
  { city: "Edmonton", provinceCode: "AB", intakeLots: 25, clearedLots: 22, clearancePercent: 88.0 },
  { city: "Markham", provinceCode: "ON", intakeLots: 38, clearedLots: 36, clearancePercent: 94.7 },
];

interface LeaderboardDealer {
  rank: number;
  name: string;
  entity: string;
  regulator: string;
  province: string;
  lotsWon: number;
  volumeCents: number;
  growthPercent: number;
  monogram: string;
}

const LEADERBOARD_DEALERS: LeaderboardDealer[] = [
  {
    rank: 1,
    name: "Pfaff Porsche Markham",
    entity: "Pfaff Automotive Partners",
    regulator: "OMVIC-481920",
    province: "ON",
    lotsWon: 58,
    volumeCents: 245000000,
    growthPercent: 24.5,
    monogram: "PP",
  },
  {
    rank: 2,
    name: "Stampede Toyota Commercial",
    entity: "Stampede Automotive Group",
    regulator: "AMVIC-849201",
    province: "AB",
    lotsWon: 42,
    volumeCents: 182000000,
    growthPercent: 18.2,
    monogram: "ST",
  },
  {
    rank: 3,
    name: "OpenRoad Audi Vancouver",
    entity: "OpenRoad Auto Group Ltd.",
    regulator: "VSA-192840",
    province: "BC",
    lotsWon: 31,
    volumeCents: 135000000,
    growthPercent: 15.1,
    monogram: "OA",
  },
  {
    rank: 4,
    name: "Woodbine Ford Lincoln",
    entity: "Woodbine Motors Group",
    regulator: "OMVIC-312984",
    province: "ON",
    lotsWon: 29,
    volumeCents: 112000000,
    growthPercent: 11.4,
    monogram: "WF",
  },
  {
    rank: 5,
    name: "HGregoire Nissan Chomedey",
    entity: "Groupe HGregoire Inc.",
    regulator: "OPC-992144",
    province: "QC",
    lotsWon: 19,
    volumeCents: 82000000,
    growthPercent: 8.7,
    monogram: "HN",
  },
];

export interface SettlementRecord {
  id: string;
  vehicle: string;
  vin: string;
  buyer: string;
  regulator: string;
  amountCents: number;
  surplusCents: number;
  completedAt: string;
  status: "SETTLED" | "ESCROW_CLEARED";
}

const SETTLEMENT_RECORDS: SettlementRecord[] = [
  {
    id: "stl-9841",
    vehicle: "2023 Porsche Macan GTS AWD",
    vin: "WP1AF2AY5NL128491",
    buyer: "Pfaff Porsche Markham",
    regulator: "OMVIC-481920",
    amountCents: 3825000,
    surplusCents: 345000,
    completedAt: "10 mins ago",
    status: "ESCROW_CLEARED",
  },
  {
    id: "stl-9840",
    vehicle: "2021 Ford F-150 Lariat 502A",
    vin: "1FTFW1E84MFA12345",
    buyer: "Woodbine Ford Commercial",
    regulator: "OMVIC-312984",
    amountCents: 3250000,
    surplusCents: 280000,
    completedAt: "42 mins ago",
    status: "SETTLED",
  },
  {
    id: "stl-9839",
    vehicle: "2023 BMW M340i xDrive Sedan",
    vin: "WBA5R7C09NF123456",
    buyer: "Budds' BMW Oakville",
    regulator: "OMVIC-192847",
    amountCents: 4100000,
    surplusCents: 310000,
    completedAt: "2 hours ago",
    status: "ESCROW_CLEARED",
  },
  {
    id: "stl-9838",
    vehicle: "2022 Lexus RX 350 F SPORT",
    vin: "2T2HZMAA5NC129841",
    buyer: "Stampede Toyota Calgary",
    regulator: "AMVIC-849201",
    amountCents: 4450000,
    surplusCents: 295000,
    completedAt: "4 hours ago",
    status: "SETTLED",
  },
  {
    id: "stl-9837",
    vehicle: "2023 Tesla Model Y Long Range",
    vin: "5YJYGDEE8PF412345",
    buyer: "OpenRoad Auto Group Vancouver",
    regulator: "VSA-192840",
    amountCents: 3900000,
    surplusCents: 240000,
    completedAt: "6 hours ago",
    status: "ESCROW_CLEARED",
  },
  {
    id: "stl-9836",
    vehicle: "2022 Audi Q7 55 TFSI Progressiv",
    vin: "WA1VAAF75ND019283",
    buyer: "Markham Audi Group",
    regulator: "OMVIC-774910",
    amountCents: 4100000,
    surplusCents: 275000,
    completedAt: "8 hours ago",
    status: "SETTLED",
  },
];

export function AdminAnalyticsView() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "YTD">("7D");
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [activeMetricTab, setActiveMetricTab] = useState<"VOLUME" | "BIDS" | "CLEARANCE">("VOLUME");
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(4); // Default to Fri peak
  const [hoveredProvince, setHoveredProvince] = useState<ProvincialMarketShare | null>(null);
  const [hoveredCityIndex, setHoveredCityIndex] = useState<number | null>(null);
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"ALL" | "SETTLED" | "ESCROW_CLEARED">("ALL");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(["stl-9841", "stl-9840"]));
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const pageSize = 5;

  // High-level KPIs
  const totalVolumeCents = 1482050000; // $14,820,500 CAD
  const gmvGrowthPercent = 23.4;
  const clearanceRatePercent = 88.6;
  const totalTransactionsCount = 312;
  const averageBidsPerLot = 14.8;
  const averageSellerSurplusCents = 264000; // $2,640 CAD
  const activeDealerCount = 142;

  // Chart Curve Math for 7-day volume
  // ViewBox: 0 0 680 200
  const chartW = 680;
  const chartH = 200;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = Math.max(...TREND_DATA_7D.map((d) => d.volumeCents));
  const minVal = Math.min(...TREND_DATA_7D.map((d) => d.volumeCents)) * 0.7;

  // Calculate coordinates
  const points = useMemo(() => {
    return TREND_DATA_7D.map((pt, idx) => {
      const x = paddingX + (idx / (TREND_DATA_7D.length - 1)) * (chartW - paddingX * 2);
      const normalizedY = (pt.volumeCents - minVal) / (maxVal - minVal);
      const y = chartH - paddingY - normalizedY * (chartH - paddingY * 2);
      return { x, y, pt };
    });
  }, [maxVal, minVal]);

  const reservePoints = useMemo(() => {
    return TREND_DATA_7D.map((pt, idx) => {
      const x = paddingX + (idx / (TREND_DATA_7D.length - 1)) * (chartW - paddingX * 2);
      const normalizedY = (pt.reserveFloorCents - minVal) / (maxVal - minVal);
      const y = chartH - paddingY - normalizedY * (chartH - paddingY * 2);
      return { x, y, pt };
    });
  }, [maxVal, minVal]);

  // Generate smooth SVG Bezier curve string
  const generateCurvedPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
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
  const reservePathD = useMemo(() => generateCurvedPath(reservePoints), [reservePoints]);

  const areaPathD = useMemo(() => {
    if (points.length < 2) return "";
    const linePath = generateCurvedPath(points);
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    return `${linePath} L ${lastX} ${chartH} L ${firstX} ${chartH} Z`;
  }, [points]);

  // Donut Arc Calculations
  const donutR = 64;
  const circumference = 2 * Math.PI * donutR;

  let accumulatedPercent = 0;
  const donutSlices = PROVINCIAL_DATA.map((prov) => {
    const strokeDasharray = `${(prov.sharePercent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += prov.sharePercent;
    return {
      ...prov,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeDonutProvince = hoveredProvince || PROVINCIAL_DATA[0];

  // Table filtering and sorting
  const filteredRecords = useMemo(() => {
    return SETTLEMENT_RECORDS.filter((rec) => {
      const matchesSearch =
        rec.vehicle.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        rec.buyer.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        rec.vin.toLowerCase().includes(searchTableQuery.toLowerCase());
      const matchesStatus = tableStatusFilter === "ALL" || rec.status === tableStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTableQuery, tableStatusFilter]);

  const { sortedData, requestSort, isSorted } = useTableSort(filteredRecords);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

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
    navigator.clipboard.writeText(vin);
    setCopiedId(vin);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    setExportNotice("Exporting Canadian Wholesale Analytics Ledger (CRA / Audit CSV)...");
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20 font-body">
      {/* 1. Executive Intelligence Header (Cleaned of arbitrary pill badges) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            Platform Analytics & Wholesale Volume
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl">
            Real-time Gross Merchandise Value (GMV), 24h sealed-bid velocity, regional quota distribution, and verifiable dealer settlement feeds.
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
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-portal-primary text-white font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                }`}
              >
                {range === "7D" ? "Last 7 Days" : range === "30D" ? "30 Days" : range === "90D" ? "90 Days" : "YTD 2026"}
              </button>
            ))}
          </div>

          {/* Provincial Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
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

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-portal-text font-bold text-xs transition-colors shadow-2xs cursor-pointer"
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

      {/* 2. Unified Top Metrics Ribbon (Directly Matching User Reference Image 2) */}
      <div className="border border-portal-border rounded-2xl bg-portal-surface shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-portal-border/60 overflow-hidden">
        {/* Metric 1: Total Spent / GMV */}
        <div className="p-6 flex items-center justify-between gap-4 hover:bg-portal-surface-hover/30 transition-colors">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-portal-text-muted uppercase tracking-wider block mb-1">
              Gross Merchandise Value
            </span>
            <span className="font-headline text-2xl sm:text-3xl font-black text-portal-text tracking-tight block">
              {formatCadCents(totalVolumeCents)}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{gmvGrowthPercent}% Net Growth</span>
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
              {totalTransactionsCount}
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              Recorded Wholesale Clearances
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
              {clearanceRatePercent}%
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              312 of 352 Reserve Floors Met
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
              {averageBidsPerLot} <span className="text-sm font-semibold text-portal-text-muted">bids/lot</span>
            </span>
            <span className="text-xs text-portal-text-muted font-medium block mt-1">
              Across {activeDealerCount} Licensed Groups
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Hero Charts: Expansive Revenue Spline Curve & Regional Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Spline Curve Chart (8 Cols) - Styled to AutoNexa Amber & Wine Tokens */}
        <div className="lg:col-span-8 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          {/* Header Strip with Toggle Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-portal-border/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-portal-text font-headline">
                  Wholesale Liquidity & Revenue Volume
                </h2>
              </div>
              <p className="text-xs text-portal-text-muted mt-0.5 font-body">
                Tracking settled transaction volume versus competitive floor reserve targets.
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
            {/* Chart Legend */}
            <div className="absolute top-2 right-4 z-10 flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-amber-500" />
                <span className="text-portal-text font-semibold">Settled GMV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-portal-text-muted/50" />
                <span className="text-portal-text-muted">Reserve Floor</span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="autonexaAmberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E59344" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#E59344" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Guidelines */}
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

              {/* Area Gradient Fill */}
              <path d={areaPathD} fill="url(#autonexaAmberGradient)" />

              {/* Reserve Target Line (Dashed) */}
              <path
                d={reservePathD}
                fill="none"
                stroke="currentColor"
                className="text-portal-text-muted/60"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Primary Volume Spline Curve (Honey Amber) */}
              <path
                d={volumePathD}
                fill="none"
                stroke="#E59344"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-sm"
              />

              {/* Interactive Hover Point & Dashed Guideline */}
              {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
                <g>
                  <line
                    x1={points[hoveredTrendIndex].x}
                    y1={paddingY}
                    x2={points[hoveredTrendIndex].x}
                    y2={chartH - paddingY}
                    stroke="#E59344"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={points[hoveredTrendIndex].x}
                    cy={points[hoveredTrendIndex].y}
                    r="6"
                    className="fill-portal-surface stroke-amber-500"
                    strokeWidth="3"
                  />
                  <circle
                    cx={points[hoveredTrendIndex].x}
                    cy={points[hoveredTrendIndex].y}
                    r="2.5"
                    className="fill-amber-500"
                  />
                </g>
              )}

              {/* Hover Trigger Hitboxes */}
              {points.map((pt, idx) => (
                <rect
                  key={idx}
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
            {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(points[hoveredTrendIndex].x / chartW) * 100}%`,
                  top: `${Math.max(10, (points[hoveredTrendIndex].y / chartH) * 100 - 8)}%`,
                }}
              >
                <div className="bg-portal-surface border border-portal-border p-2.5 rounded-xl shadow-xl text-xs space-y-1 min-w-[160px]">
                  <div className="flex items-center justify-between text-[10px] text-portal-text-muted font-mono font-bold">
                    <span>{points[hoveredTrendIndex].pt.dateStr}</span>
                    <span>{points[hoveredTrendIndex].pt.day}</span>
                  </div>
                  <div className="font-headline font-black text-sm text-portal-text">
                    {formatCadCents(points[hoveredTrendIndex].pt.volumeCents)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-portal-text-muted pt-1 border-t border-portal-border/60">
                    <span>{points[hoveredTrendIndex].pt.lotsCleared} Lots Cleared</span>
                    <span className="font-mono text-emerald-500 font-bold">
                      {points[hoveredTrendIndex].pt.bidsCount} Bids
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* X-Axis Day Labels */}
          <div className="flex items-center justify-between px-6 pt-2 text-xs font-mono text-portal-text-muted border-t border-portal-border/60">
            {TREND_DATA_7D.map((d, idx) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setHoveredTrendIndex(idx)}
                className={`font-semibold transition-colors cursor-pointer ${
                  hoveredTrendIndex === idx ? "text-amber-500 font-bold" : "hover:text-portal-text"
                }`}
              >
                {d.day} <span className="text-[10px] opacity-70">({d.dateStr.split(" ")[1]})</span>
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
                {PROVINCIAL_DATA.reduce((acc, p) => acc + p.dealersCount, 0)} Dealers
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1.5 font-body">
              Canadian wholesale clearing volume by registrar jurisdiction.
            </p>
          </div>

          {/* Semicircular / Donut Ring */}
          <div className="relative my-4 flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {donutSlices.map((prov) => {
                const isHovered = hoveredProvince?.code === prov.code;
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
                    onMouseEnter={() => setHoveredProvince(prov)}
                    onMouseLeave={() => setHoveredProvince(null)}
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
            {PROVINCIAL_DATA.map((prov) => {
              const active = activeDonutProvince.code === prov.code;
              return (
                <div
                  key={prov.code}
                  onMouseEnter={() => setHoveredProvince(prov)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                    active ? "bg-portal-surface-hover font-semibold" : "hover:bg-portal-surface-hover/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prov.color }} />
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
                Metropolitan Intake & Clearance Velocity
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
              Comparing incoming vehicle consignments with completed 24-hour dealer auction clearings by major Canadian metro hub.
            </p>
          </div>

          {/* Grouped Bar Chart Visual with Dedicated Left Y-Axis & Explicit Heights */}
          <div className="my-4 pt-2 flex items-stretch gap-2.5">
            {/* Dedicated Left Y-Axis Scale (Zero Overlap with Bars) */}
            <div className="w-11 h-[135px] flex flex-col justify-between items-end pr-1 text-[10px] font-mono text-portal-text-muted shrink-0 select-none">
              <span>60 lots</span>
              <span>40 lots</span>
              <span>20 lots</span>
              <span>0</span>
            </div>

            {/* Bars & Gridlines Canvas */}
            <div className="flex-1 relative">
              {/* Background Dashed Gridlines spanning only the bars area */}
              <div className="absolute inset-x-0 top-0 h-[135px] flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-portal-border/60 w-full" />
                <div className="border-b border-dashed border-portal-border/60 w-full" />
                <div className="border-b border-dashed border-portal-border/60 w-full" />
                <div className="border-b border-portal-border w-full" />
              </div>

              {/* Bars Container */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-[175px] relative z-10">
                {CITY_VOLUME_BARS.map((hub, idx) => {
                  const maxCityLots = 70;
                  const barAreaHeight = 135; // px max height for bars
                  const intakePx = Math.round((hub.intakeLots / maxCityLots) * barAreaHeight);
                  const clearedPx = Math.round((hub.clearedLots / maxCityLots) * barAreaHeight);
                  const isHovered = hoveredCityIndex === idx;

                  return (
                    <div
                      key={hub.city}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredCityIndex(idx)}
                      onMouseLeave={() => setHoveredCityIndex(null)}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-30 px-2.5 py-1 rounded-lg bg-portal-surface border border-portal-border shadow-lg text-center whitespace-nowrap animate-fadeIn pointer-events-none">
                          <div className="text-[10px] font-bold text-portal-text font-headline">
                            {hub.city} • <span className="text-amber-500 font-mono">{hub.clearancePercent}%</span>
                          </div>
                          <div className="text-[9px] font-mono text-portal-text-muted">
                            {hub.clearedLots} cleared / {hub.intakeLots} intake
                          </div>
                        </div>
                      )}

                    {/* Bar Columns */}
                    <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full pb-1">
                      {/* Intake Bar (Slate) */}
                      <div
                        className="w-2.5 sm:w-3.5 rounded-t-sm bg-portal-text-muted/30 transition-all duration-300 group-hover:bg-portal-text-muted/50"
                        style={{ height: `${intakePx}px` }}
                        title={`Intake: ${hub.intakeLots} lots`}
                      />
                      {/* Cleared Bar (AutoNexa Amber) */}
                      <div
                        className="w-2.5 sm:w-3.5 rounded-t-sm bg-amber-500 transition-all duration-300 group-hover:bg-amber-400 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${clearedPx}px` }}
                        title={`Cleared: ${hub.clearedLots} lots`}
                      />
                    </div>

                    {/* City Labels */}
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

        <div className="pt-3 border-t border-portal-border/60 flex items-center justify-between text-xs font-mono text-portal-text-muted">
            <span>Peak Clearance: <strong className="text-portal-text">Markham, ON (94.7%)</strong></span>
            <span>Total Intake: <strong className="text-portal-text">278 lots</strong></span>
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

          <div className="divide-y divide-portal-border/50">
            {LEADERBOARD_DEALERS.map((dealer) => (
              <div
                key={dealer.name}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-portal-surface-hover border border-portal-border flex items-center justify-center font-headline font-bold text-xs text-portal-text shrink-0 group-hover:border-portal-primary/50 transition-colors">
                    {dealer.monogram}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-portal-text truncate block group-hover:text-portal-primary transition-colors">
                      {dealer.name}
                    </span>
                    <span className="text-[11px] text-portal-text-muted block truncate font-mono">
                      {dealer.lotsWon} lots won • {dealer.province}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-headline font-bold text-xs text-portal-text">
                    {formatCadCents(dealer.volumeCents)}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 inline-flex items-center gap-0.5">
                    +{dealer.growthPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Clean SaaS Settlement Ledger Table (Matching Reference Images 4 & 5) */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {/* Table Header Strip with Search & Filters */}
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
              Historical record of all verified dealer settlements, automated escrow releases, and trade-in surplus payouts.
            </p>
          </div>

          {/* Action Tools: Live Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicle, dealer, VIN..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-body"
              />
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs font-semibold">
              {(["ALL", "SETTLED", "ESCROW_CLEARED"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTableStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    tableStatusFilter === filter
                      ? "bg-portal-surface text-portal-text shadow-2xs font-bold"
                      : "text-portal-text-muted hover:text-portal-text"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter === "SETTLED" ? "Settled" : "Escrow Paid"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Surface */}
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
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rec.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      {/* Vehicle Lot */}
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

                      {/* Purchasing Dealer */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-portal-text block">
                          {rec.buyer}
                        </span>
                        <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                          {rec.regulator}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-headline font-bold text-sm text-portal-text">
                        {formatCadCents(rec.amountCents)}
                      </td>

                      {/* Seller Surplus */}
                      <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCadCents(rec.surplusCents)}
                      </td>

                      {/* Soft Pastel Status Pill */}
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
                              rec.status === "ESCROW_CLEARED" ? "bg-indigo-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>{rec.status === "ESCROW_CLEARED" ? "Escrow Cleared" : "Settled"}</span>
                        </span>
                      </td>

                      {/* Completed */}
                      <td className="py-4 pr-6 pl-4 text-right text-portal-text-muted font-mono text-xs">
                        {rec.completedAt}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-portal-text-muted">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No settlements match your search query</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTableQuery("");
                        setTableStatusFilter("ALL");
                      }}
                      className="text-xs font-semibold text-portal-primary mt-1 hover:underline cursor-pointer"
                    >
                      Clear search filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
