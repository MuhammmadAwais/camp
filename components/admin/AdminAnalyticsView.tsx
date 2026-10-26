"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
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
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

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
  colorHover: string;
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
    avgSurplusCents: 285000, // $2,850 CAD
    color: "#6366f1", // Indigo
    colorHover: "#4f46e5",
  },
  {
    province: "Alberta",
    code: "AB",
    regulator: "AMVIC",
    volumeCents: 312000000, // $3.12M
    sharePercent: 21.1,
    dealersCount: 29,
    lotsCount: 104,
    avgSurplusCents: 245000, // $2,450 CAD
    color: "#f59e0b", // Amber
    colorHover: "#d97706",
  },
  {
    province: "British Columbia",
    code: "BC",
    regulator: "VSA",
    volumeCents: 178000000, // $1.78M
    sharePercent: 12.0,
    dealersCount: 16,
    lotsCount: 62,
    avgSurplusCents: 262000, // $2,620 CAD
    color: "#10b981", // Emerald
    colorHover: "#059669",
  },
  {
    province: "Quebec",
    code: "QC",
    regulator: "OPC",
    volumeCents: 98050000, // $980.5K
    sharePercent: 6.6,
    dealersCount: 9,
    lotsCount: 38,
    avgSurplusCents: 210000, // $2,100 CAD
    color: "#ec4899", // Pink
    colorHover: "#db2777",
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

interface SettlementRecord {
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
    regulator: "OMVIC",
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
    regulator: "OMVIC",
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
    regulator: "OMVIC",
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
    regulator: "AMVIC",
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
    regulator: "VSA",
    amountCents: 3900000,
    surplusCents: 240000,
    completedAt: "6 hours ago",
    status: "ESCROW_CLEARED",
  },
];

export function AdminAnalyticsView() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "YTD">("7D");
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [activeMetricTab, setActiveMetricTab] = useState<"VOLUME" | "BIDS" | "CLEARANCE">("VOLUME");
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(4); // Default to Fri peak
  const [hoveredProvince, setHoveredProvince] = useState<ProvincialMarketShare | null>(null);
  const [hoveredCityIndex, setHoveredCityIndex] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(["stl-9841", "stl-9840"]));
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // High-level KPIs
  const totalVolumeCents = 1482050000; // $14,820,500 CAD
  const gmvGrowthPercent = 23.4;
  const clearanceRatePercent = 88.6;
  const averageBidsPerLot = 14.8;
  const averageSellerSurplusCents = 264000; // $2,640 CAD
  const activeDealerCount = 142;
  const escrowVaultActiveCents = 384250000; // $3,842,500 CAD

  // Chart Curve Math for 7-day volume
  // ViewBox: 0 0 600 220
  const chartW = 600;
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

  // Generate smooth SVG Catmull-Rom / Bezier curve string
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
  // Total circumference for r = 70 is 2 * PI * 70 = 439.82
  const donutR = 70;
  const circumference = 2 * Math.PI * donutR;

  // Compute stroke offsets
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

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const handleSelectAllRows = () => {
    if (selectedRows.size === SETTLEMENT_RECORDS.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(SETTLEMENT_RECORDS.map((r) => r.id)));
    }
  };

  const handleExport = () => {
    setExportNotice("Exporting Canadian Wholesale Analytics Ledger (CRA / Audit CSV)...");
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20 font-body">
      {/* 1. Executive Intelligence Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Canadian National Sourcing Network</span>
            <span>•</span>
            <span>Live Clearing Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            Wholesale Analytics & Provincial Liquidity
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl">
            Real-time Gross Merchandise Value (GMV), 24h sealed-bid velocity, regional quota distribution, and verifiable dealer settlement feeds.
          </p>
        </div>

        {/* Global Controls & Export Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Segmented Control (Inspired by Image 2 & Image 3) */}
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
              <option value="ALL">All Jurisdictions (Canada)</option>
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

      {/* 2. Top KPI Metrics Row (Inspired by Images 1, 2, 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Merchandise Value */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-3 relative overflow-hidden group hover:border-portal-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text-muted">
              <DollarSign className="w-4 h-4 text-portal-primary" />
              <span>Gross Merchandise Value</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+{gmvGrowthPercent}%</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-headline text-portal-text tracking-tight">
              {formatCadCents(totalVolumeCents)}
            </div>
            <p className="text-xs text-portal-text-muted mt-1">
              +$2.8M CAD over prior 30-day clearing cycle
            </p>
          </div>

          {/* Mini Sparkline Background Indicator */}
          <div className="h-1.5 w-full bg-portal-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-portal-primary rounded-full transition-all duration-700" style={{ width: "78%" }} />
          </div>
        </div>

        {/* KPI 2: Auction Clearance Rate */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text-muted">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Clearance Rate</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+4.2%</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-headline text-portal-text tracking-tight">
              {clearanceRatePercent}%
            </div>
            <p className="text-xs text-portal-text-muted mt-1">
              312 of 352 vehicle lots met reserve floor
            </p>
          </div>

          <div className="h-1.5 w-full bg-portal-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${clearanceRatePercent}%` }} />
          </div>
        </div>

        {/* KPI 3: Bidding Velocity */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text-muted">
              <Gavel className="w-4 h-4 text-amber-500" />
              <span>Bidding Velocity</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+18.5%</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-headline text-portal-text tracking-tight">
              {averageBidsPerLot} <span className="text-base font-semibold text-portal-text-muted">bids/lot</span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1">
              Across {activeDealerCount} registered dealership groups
            </p>
          </div>

          <div className="h-1.5 w-full bg-portal-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: "65%" }} />
          </div>
        </div>

        {/* KPI 4: Consumer Surplus Generated */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-3 relative overflow-hidden group hover:border-portal-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text-muted">
              <ArrowUpRight className="w-4 h-4 text-portal-primary" />
              <span>Avg. Seller Surplus</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+12.8%</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-headline text-emerald-600 dark:text-emerald-400 tracking-tight">
              +{formatCadCents(averageSellerSurplusCents)}
            </div>
            <p className="text-xs text-portal-text-muted mt-1">
              Delivered directly above typical dealer trade-in offers
            </p>
          </div>

          <div className="h-1.5 w-full bg-portal-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: "82%" }} />
          </div>
        </div>
      </div>

      {/* 3. Hero Visual Section: Escrow Sinking Fund Card (Left) + Spline Trend Curve Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Visual Gradient Escrow Vault Card (Inspired by Image 1 Left Card) */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-amber-950 text-white shadow-lg flex flex-col justify-between relative overflow-hidden border border-white/10">
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Label */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="font-headline font-bold text-sm tracking-wide">
                Direct Clearing Vault
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90">
              PIPEDA / Law 25
            </span>
          </div>

          {/* Center Graphic: Realistic Shimmering Credit Card / Vault Badge */}
          <div className="my-6 relative z-10 p-5 rounded-2xl bg-gradient-to-r from-amber-400/90 via-amber-500 to-amber-600 text-neutral-950 shadow-xl border border-white/30 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-widest uppercase">
                AutoNexa Escrow
              </span>
              <div className="w-7 h-5 rounded bg-black/20 border border-black/10 flex items-center justify-center font-mono text-[9px] font-black">
                CAD
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-medium opacity-80 block">
                Total Sinking Vault Reserve
              </span>
              <span className="font-headline text-2xl sm:text-3xl font-black tracking-tight block">
                {formatCadCents(escrowVaultActiveCents)}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-black/15 flex items-center justify-between text-xs font-mono font-bold">
              <span>VAULT: *4918-ON</span>
              <span>100% BONDED</span>
            </div>
          </div>

          {/* Bottom Metric Pill */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Settlement Clearance Target</span>
              <span className="font-bold text-white">92% / 24h</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "92%" }} />
            </div>
            <p className="text-[11px] text-white/70">
              Pre-funded buyer EFT accounts guarantee zero seller default risks across Canada.
            </p>
          </div>
        </div>

        {/* Card 2: Interactive SVG Multi-Line Trend Chart (Inspired by Image 1 & Image 3) */}
        <div className="lg:col-span-8 rounded-3xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          {/* Header & Metric Toggle Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-portal-border/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-portal-text font-headline">
                  Wholesale Liquidity & Clearance Trends
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                  Daily CAD Telemetry
                </span>
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

          {/* Interactive SVG Chart Stage */}
          <div className="relative my-4 w-full h-[240px]">
            {/* Legend Indicators */}
            <div className="absolute top-2 right-4 z-10 flex items-center gap-4 text-xs font-semibold font-body">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-portal-text">Settled Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-amber-500" />
                <span className="text-portal-text-muted">Reserve Floor</span>
              </div>
            </div>

            {/* SVG Canvas */}
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="volumeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>

                {/* Vertical Cursor Dash Pattern */}
                <linearGradient id="cursorGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
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
                    className="text-portal-border/50"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPathD} fill="url(#volumeAreaGradient)" />

              {/* Reserve Target Line (Amber dashed curve) */}
              <path
                d={reservePathD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeOpacity="0.85"
              />

              {/* Primary Volume Spline Curve (Indigo vibrant curve) */}
              <path
                d={volumePathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-sm"
              />

              {/* Interactive Hover Point & Dashed Guideline */}
              {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
                <g>
                  {/* Vertical Guide Crosshair */}
                  <line
                    x1={points[hoveredTrendIndex].x}
                    y1={paddingY}
                    x2={points[hoveredTrendIndex].x}
                    y2={chartH - paddingY}
                    stroke="currentColor"
                    className="text-portal-primary"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Highlight Anchor Dot */}
                  <circle
                    cx={points[hoveredTrendIndex].x}
                    cy={points[hoveredTrendIndex].y}
                    r="6"
                    className="fill-portal-surface stroke-indigo-500"
                    strokeWidth="3"
                  />
                  <circle
                    cx={points[hoveredTrendIndex].x}
                    cy={points[hoveredTrendIndex].y}
                    r="2.5"
                    className="fill-indigo-500"
                  />
                </g>
              )}

              {/* Transparent Click / Hover Target Columns */}
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

            {/* Floating Rich Tooltip (Inspired by Image 1's $6,156 badge) */}
            {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-200 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(points[hoveredTrendIndex].x / chartW) * 100}%`,
                  top: `${Math.max(10, (points[hoveredTrendIndex].y / chartH) * 100 - 8)}%`,
                }}
              >
                <div className="bg-portal-surface/95 dark:bg-neutral-900/95 backdrop-blur-md border border-portal-border p-2.5 rounded-xl shadow-xl text-xs space-y-1 min-w-[160px]">
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
                  hoveredTrendIndex === idx ? "text-portal-primary font-bold" : "hover:text-portal-text"
                }`}
              >
                {d.day} <span className="text-[10px] opacity-70">({d.dateStr.split(" ")[1]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Donut Chart (Provincial Share) & Grouped Bar Chart (Regional Intake Velocity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card A: Provincial Donut Chart (Inspired by Images 1, 2, 3) */}
        <div className="lg:col-span-5 rounded-3xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-portal-primary" />
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Provincial Market Distribution
                </h3>
              </div>
              <span className="text-xs font-mono text-portal-text-muted">
                {PROVINCIAL_DATA.reduce((acc, p) => acc + p.dealersCount, 0)} Dealers
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-2 font-body">
              Wholesale trade volume segmented by Canadian provincial registrar jurisdictions.
            </p>
          </div>

          {/* Center Donut SVG Canvas */}
          <div className="relative my-6 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
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
                    strokeWidth={isHovered ? "28" : "22"}
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

            {/* Centered Donut KPI Label (Inspired by Image 2 & Image 3) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-mono uppercase tracking-wider text-portal-text-muted">
                {activeDonutProvince.province}
              </span>
              <span className="font-headline text-xl sm:text-2xl font-black text-portal-text tracking-tight mt-0.5">
                {activeDonutProvince.sharePercent}%
              </span>
              <span className="text-xs font-semibold text-portal-text-muted font-mono">
                {formatCadCents(activeDonutProvince.volumeCents)}
              </span>
            </div>
          </div>

          {/* Sliced Legend Pills with Interactive Hover */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-portal-border/60">
            {PROVINCIAL_DATA.map((prov) => {
              const active = activeDonutProvince.code === prov.code;
              return (
                <div
                  key={prov.code}
                  onMouseEnter={() => setHoveredProvince(prov)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? "bg-portal-surface-hover border-portal-primary/40 shadow-2xs"
                      : "bg-portal-surface hover:bg-portal-surface-hover/60 border-portal-border"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: prov.color }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-portal-text block truncate">
                        {prov.code} ({prov.regulator})
                      </span>
                      <span className="text-[10px] text-portal-text-muted block font-mono">
                        {prov.dealersCount} dealers
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-portal-text ml-2 shrink-0">
                    {prov.sharePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card B: Grouped Vertical Bar Chart (City Volume & Clearance Intake) */}
        <div className="lg:col-span-7 rounded-3xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-portal-border/60">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-portal-primary" />
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Metropolitan Hub Intake & Clearance
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-portal-primary/60" />
                  <span className="text-portal-text-muted">Intake Lots</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-portal-text">Cleared</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-portal-text-muted mt-2 font-body">
              Comparing incoming vehicle consignments with completed 24-hour dealer auction clearings by major Canadian metro hub.
            </p>
          </div>

          {/* Grouped Bar Chart Visual Stage */}
          <div className="my-6 pt-4 space-y-4">
            <div className="grid grid-cols-7 gap-3 sm:gap-5 items-end h-[180px] px-2">
              {CITY_VOLUME_BARS.map((hub, idx) => {
                const maxCityLots = 70;
                const intakeHeight = (hub.intakeLots / maxCityLots) * 100;
                const clearedHeight = (hub.clearedLots / maxCityLots) * 100;
                const isHovered = hoveredCityIndex === idx;

                return (
                  <div
                    key={hub.city}
                    className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredCityIndex(idx)}
                    onMouseLeave={() => setHoveredCityIndex(null)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text shadow-sm whitespace-nowrap animate-fadeIn">
                        {hub.clearancePercent}% clear
                      </div>
                    )}

                    {/* Twin Bar Columns */}
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      {/* Bar 1: Intake */}
                      <div
                        className="w-3 sm:w-4 rounded-full bg-portal-primary/30 transition-all duration-300 group-hover:bg-portal-primary/60"
                        style={{ height: `${intakeHeight}%` }}
                        title={`${hub.city}: ${hub.intakeLots} Lots Submitted`}
                      />
                      {/* Bar 2: Cleared (Golden Amber) */}
                      <div
                        className="w-3 sm:w-4 rounded-full bg-amber-500 transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${clearedHeight}%` }}
                        title={`${hub.city}: ${hub.clearedLots} Lots Sold`}
                      />
                    </div>

                    {/* City Label */}
                    <div className="text-center">
                      <span className="text-xs font-bold text-portal-text block truncate max-w-[50px]">
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

          {/* Bottom City Summary Strip */}
          <div className="pt-3 border-t border-portal-border/60 flex items-center justify-between text-xs font-mono text-portal-text-muted">
            <span>Peak Clearance: <strong>Markham, ON (94.7%)</strong></span>
            <span>Total Metropolitan Intake: <strong>278 lots</strong></span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Dealership Sourcing Leaderboard (Left) + Real-time Wholesale Settlements Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dealership Sourcing Leaderboard (5 Cols) (Inspired by Image 2 Bottom Left) */}
        <div className="lg:col-span-5 rounded-3xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
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
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Monogram Initial Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-portal-surface-hover border border-portal-border flex items-center justify-center font-headline font-bold text-xs text-portal-text shrink-0 group-hover:border-portal-primary/50 transition-colors">
                    {dealer.monogram}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-portal-text truncate group-hover:text-portal-primary transition-colors">
                        {dealer.name}
                      </span>
                      <span className="text-[10px] font-mono text-portal-text-muted">
                        ({dealer.province})
                      </span>
                    </div>
                    <span className="text-[11px] text-portal-text-muted block truncate font-mono">
                      {dealer.lotsWon} lots won • {dealer.regulator}
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

        {/* Real-time Settlements Ledger (7 Cols) (Inspired by Image 2 & Image 4 SaaS Table) */}
        <div className="lg:col-span-7 rounded-3xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-portal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Recent Wholesale Settlements
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  EFT Verified
                </span>
              </div>
              <p className="text-xs text-portal-text-muted mt-0.5 font-body">
                Automated escrow disbursements and trade-in surplus releases.
              </p>
            </div>

            <Link
              href="/admin/auctions"
              className="text-xs font-bold text-portal-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>View All Auctions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table Surface */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-body">
              <thead>
                <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30 text-portal-text-muted">
                  <th className="py-3 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === SETTLEMENT_RECORDS.length}
                      onChange={handleSelectAllRows}
                      className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Vehicle Lot</th>
                  <th className="py-3 px-3 font-semibold">Purchasing Dealer</th>
                  <th className="py-3 px-3 font-semibold">Amount (CAD)</th>
                  <th className="py-3 px-3 font-semibold">Seller Surplus</th>
                  <th className="py-3 pr-6 pl-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border/40">
                {SETTLEMENT_RECORDS.map((rec) => {
                  const isChecked = selectedRows.has(rec.id);
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rec.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      {/* Vehicle Lot */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-portal-text block truncate group-hover:text-portal-primary transition-colors max-w-[180px]">
                          {rec.vehicle}
                        </span>
                        <span className="text-[10px] text-portal-text-muted font-mono block mt-0.5">
                          VIN: ···{rec.vin.slice(-6)}
                        </span>
                      </td>

                      {/* Dealer & Regulator */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-portal-text block truncate max-w-[160px]">
                          {rec.buyer}
                        </span>
                        <span className="text-[10px] text-portal-text-muted font-mono block mt-0.5">
                          {rec.regulator} Verified
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 font-headline font-bold text-portal-text">
                        {formatCadCents(rec.amountCents)}
                      </td>

                      {/* Surplus */}
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCadCents(rec.surplusCents)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-6 pl-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>{rec.status === "ESCROW_CLEARED" ? "Escrow Paid" : "Settled"}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-portal-border/60 bg-portal-surface-hover/20 flex items-center justify-between text-xs text-portal-text-muted font-mono">
            <span>Cryptographically sealed under Canadian PIPEDA standards</span>
            <span className="text-emerald-500 font-bold">100% Non-Repudiation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
