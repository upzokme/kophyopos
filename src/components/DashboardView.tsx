/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Smartphone,
  CheckCircle,
  ShoppingBag,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRight,
  PackageCheck,
  Plus,
  BarChart3,
  Award,
} from "lucide-react";
import { DashboardStats, Sale } from "../types.js";
import { formatKyat, formatBurmeseDate, toMyanmarDigits } from "../utils.js";

interface DashboardViewProps {
  stats: DashboardStats;
  recentSales: (Sale & { brand: string; model: string; color: string; imei: string })[];
  setActiveTab: (tab: string) => void;
  onAddPhoneClick: () => void;
}

export default function DashboardView({ stats, recentSales, setActiveTab, onAddPhoneClick }: DashboardViewProps) {
  const [hoveredBrandIndex, setHoveredBrandIndex] = useState<number | null>(null);

  // Group sales chronologically by month
  const monthlyData = useMemo(() => {
    if (!recentSales || recentSales.length === 0) {
      return [];
    }

    const parsedSales = recentSales
      .map((s) => {
        const d = new Date(s.saleDate);
        return {
          year: d.getFullYear(),
          month: d.getMonth() + 1, // 1-12
          sellingPrice: s.sellingPrice || 0,
          profit: s.profit || 0,
        };
      })
      .filter((s) => !isNaN(s.year));

    if (parsedSales.length === 0) return [];

    // Find the min year/month
    let minYear = Math.min(...parsedSales.map((s) => s.year));
    let minMonth = 12;
    parsedSales.forEach((s) => {
      if (s.year === minYear && s.month < minMonth) {
        minMonth = s.month;
      }
    });

    const now = new Date();
    const maxYear = now.getFullYear();
    const maxMonth = now.getMonth() + 1;

    const periods: { year: number; month: number; label: string; revenue: number; profit: number }[] = [];
    const englishMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let curYear = minYear;
    let curMonth = minMonth;

    // Avoid infinite loop if somehow data is in the future
    let limit = 0;
    while ((curYear < maxYear || (curYear === maxYear && curMonth <= maxMonth)) && limit < 120) {
      limit++;
      const label = `${englishMonths[curMonth - 1]} ${toMyanmarDigits(curYear)}`;
      
      const monthSales = parsedSales.filter((s) => s.year === curYear && s.month === curMonth);
      const revenue = monthSales.reduce((sum, s) => sum + s.sellingPrice, 0);
      const profit = monthSales.reduce((sum, s) => sum + s.profit, 0);

      periods.push({
        year: curYear,
        month: curMonth,
        label,
        revenue,
        profit,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    return periods;
  }, [recentSales]);

  const maxRevenue = useMemo(() => {
    if (monthlyData.length === 0) return 100000;
    const maxVal = Math.max(...monthlyData.map((d) => d.revenue), 100000);
    return maxVal;
  }, [monthlyData]);

  const yTicks = useMemo(() => {
    return [maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0];
  }, [maxRevenue]);

  const formatYAxis = (val: number) => {
    if (val === 0) return "၀ ကျပ်";
    if (val >= 100000) {
      return `${toMyanmarDigits((val / 100000).toFixed(1).replace(".0", ""))} သိန်း`;
    }
    return `${toMyanmarDigits(val.toLocaleString())} ကျပ်`;
  };

  // Group sales by Brand
  const brandSalesData = useMemo(() => {
    if (!recentSales || recentSales.length === 0) {
      return [];
    }

    const brandMap: Record<string, { brand: string; unitsSold: number; totalRevenue: number; totalProfit: number }> = {};

    recentSales.forEach((sale) => {
      const brand = sale.brand || "အခြား";
      if (!brandMap[brand]) {
        brandMap[brand] = {
          brand,
          unitsSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }
      brandMap[brand].unitsSold += 1;
      brandMap[brand].totalRevenue += sale.sellingPrice || 0;
      brandMap[brand].totalProfit += sale.profit || 0;
    });

    return Object.values(brandMap).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [recentSales]);

  const totalBrandUnits = useMemo(() => {
    return brandSalesData.reduce((sum, item) => sum + item.unitsSold, 0);
  }, [brandSalesData]);

  const pieSlices = useMemo(() => {
    if (brandSalesData.length === 0) return [];
    let accumulatedAngle = -90; // Start at 12 o'clock

    return brandSalesData.map((data, index) => {
      const percentage = totalBrandUnits > 0 ? (data.unitsSold / totalBrandUnits) * 100 : 0;
      const angle = (percentage / 100) * 360;

      // Start angle & end angle in radians
      const startAngleRad = (accumulatedAngle * Math.PI) / 180;
      const endAngleRad = ((accumulatedAngle + angle) * Math.PI) / 180;

      // Outer radius
      const r = 50;
      const cx = 60;
      const cy = 60;

      // Coordinates for arc
      const x1 = cx + r * Math.cos(startAngleRad);
      const y1 = cy + r * Math.sin(startAngleRad);
      const x2 = cx + r * Math.cos(endAngleRad);
      const y2 = cy + r * Math.sin(endAngleRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      // Path data
      let pathData = "";
      if (percentage >= 99.9) {
        pathData = `
          M ${cx} ${cy - r}
          A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}
          Z
        `;
      } else {
        pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      }

      const middleAngle = accumulatedAngle + angle / 2;
      accumulatedAngle += angle;

      return {
        ...data,
        percentage,
        pathData,
        middleAngle,
      };
    });
  }, [brandSalesData, totalBrandUnits]);

  const getSliceTransform = (middleAngle: number, isHovered: boolean) => {
    if (!isHovered) return "translate(0, 0)";
    const shiftRadius = 3.5; // Shift outward
    const angleRad = (middleAngle * Math.PI) / 180;
    const dx = shiftRadius * Math.cos(angleRad);
    const dy = shiftRadius * Math.sin(angleRad);
    return `translate(${dx}px, ${dy}px) scale(1.04)`;
  };

  const getBrandColor = (brand: string, index: number) => {
    const colors = [
      "#6366f1", // Indigo
      "#06b6d4", // Cyan
      "#10b981", // Emerald
      "#f59e0b", // Amber
      "#ec4899", // Pink
      "#3b82f6", // Blue
      "#8b5cf6", // Violet
      "#14b8a6", // Teal
    ];
    const b = brand.toLowerCase();
    if (b.includes("apple") || b.includes("iphone")) return "#475569"; // Slate 600
    if (b.includes("samsung")) return "#2563eb"; // Blue 600
    if (b.includes("xiaomi") || b.includes("redmi")) return "#ea580c"; // Orange 600
    if (b.includes("oppo")) return "#16a34a"; // Green 600
    if (b.includes("vivo")) return "#0ea5e9"; // Sky 500
    return colors[index % colors.length];
  };

  const getBrandBgColor = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes("apple") || b.includes("iphone")) return "bg-slate-700 dark:bg-slate-400";
    if (b.includes("samsung")) return "bg-blue-600 dark:bg-blue-500";
    if (b.includes("xiaomi") || b.includes("redmi")) return "bg-orange-500 dark:bg-orange-600";
    if (b.includes("oppo")) return "bg-emerald-600 dark:bg-emerald-500";
    if (b.includes("vivo")) return "bg-sky-500 dark:bg-sky-400";
    return "bg-indigo-600 dark:bg-indigo-500";
  };

  const getBrandTextColor = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes("apple") || b.includes("iphone")) return "text-slate-700 dark:text-slate-300";
    if (b.includes("samsung")) return "text-blue-600 dark:text-blue-400";
    if (b.includes("xiaomi") || b.includes("redmi")) return "text-orange-600 dark:text-orange-400";
    if (b.includes("oppo")) return "text-emerald-600 dark:text-emerald-400";
    if (b.includes("vivo")) return "text-sky-600 dark:text-sky-400";
    return "text-indigo-600 dark:text-indigo-400";
  };

  const statCards = [
    {
      title: "လက်ကျန်နှင့် ရောင်းပြီး စုစုပေါင်းဖုန်းအရေအတွက်",
      value: `${toMyanmarDigits(stats.totalPhones)} လုံး`,
      icon: Smartphone,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
      description: "စာရင်းသွင်းထားသမျှ ဖုန်းစုစုပေါင်း",
      tab: "stock",
    },
    {
      title: "ရောင်းပြီးဖုန်းအရေအတွက်",
      value: `${toMyanmarDigits(stats.soldPhones)} လုံး`,
      icon: ShoppingBag,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400",
      description: "အောင်မြင်စွာ ရောင်းချပြီးစီးမှုများ",
      tab: "sold",
    },
    {
      title: "ကျန်ရှိသောဖုန်းအရေအတွက်",
      value: `${toMyanmarDigits(stats.availablePhones)} လုံး`,
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
      description: "ရောင်းရန်ကျန်ရှိသော ဖုန်းလက်ကျန်",
      tab: "stock",
    },
    {
      title: "ကျန်ရှိသောဝယ်ရင်ဈေး စုစုပေါင်းတန်ဖိုး",
      value: formatKyat(stats.currentStockValue || 0),
      icon: DollarSign,
      color: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
      description: "လက်ကျန်ဖုန်းများ၏ ဝယ်ရင်းဈေး စုစုပေါင်းတန်ဖိုး",
      tab: "stock",
    },
    {
      title: "ယနေ့ရောင်းရငွေ",
      value: formatKyat(stats.todaySales),
      icon: Zap,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400",
      description: "ယနေ့ရရှိသော စုစုပေါင်းရောင်းရငွေ",
      tab: "reports",
    },
    {
      title: "ယခုလရောင်းရငွေ",
      value: formatKyat(stats.thisMonthSales),
      icon: DollarSign,
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
      description: "ယခုလအတွင်း စုစုပေါင်းရောင်းရငွေ",
      tab: "reports",
    },
    {
      title: "ယခုလအမြတ်ငွေ",
      value: formatKyat(stats.thisMonthProfit),
      icon: TrendingUp,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400",
      description: `အမြတ်နှုန်းစွမ်းဆောင်ရည် ${stats.thisMonthSales > 0 ? toMyanmarDigits(((stats.thisMonthProfit / stats.thisMonthSales) * 100).toFixed(0)) : "၀"}% ရှိသည်`,
      tab: "reports",
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">အရောင်းဆိုင်၏ အရောင်းလှုပ်ရှားမှုနှင့် ဖုန်းလက်ကျန်များ အချိန်နှင့်တပြေးညီ ခြုံငုံသုံးသပ်ချက်။</p>
        </div>
        <button
          onClick={onAddPhoneClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-md shadow-indigo-600/10 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 self-start sm:self-auto shrink-0"
        >
          <Plus className="h-5 w-5" />
          ဖုန်းအသစ်ထည့်မည်
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.tab)}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 cursor-pointer transition-all duration-200 flex items-start justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="text-2xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block">{card.description}</span>
              </div>
              <div className={`p-3 rounded-xl shadow-sm ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Sales & Profit Candle Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white font-display text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              လစဉ် အရောင်းတိုးတက်မှုနှင့် အမြတ်ငွေပြဇယား
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              စတင်ရောင်းချသည့်လမှ နောက်ဆုံးလအထိ လစဉ် အရောင်းစွမ်းဆောင်ရည် ခြုံငုံသုံးသပ်ချက်
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3.5 h-3.5 bg-indigo-500/10 dark:bg-indigo-400/10 border-2 border-indigo-500/30 rounded" />
              <span>ရောင်းရငွေ (Revenue)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3.5 h-3.5 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded" />
              <span>အမြတ်ငွေ (Profit)</span>
            </div>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-xl">
            <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">အရောင်းမှတ်တမ်းများ မရှိသေးပါ</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              ဖုန်းများကို ရောင်းချပြီးပါက လစဉ်အရောင်းတိုးတက်မှု ဇယားကို ဤနေရာတွင် အလိုအလျောက် ရေးဆွဲပြသပေးမည် ဖြစ်ပါသည်။
            </p>
          </div>
        ) : (
          <div className="flex h-72 gap-3 items-stretch mt-2">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 pr-2 select-none h-[calc(100%-24px)] text-right w-16">
              {yTicks.map((tick, i) => (
                <span key={i} className="leading-none">{formatYAxis(tick)}</span>
              ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative h-full">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between h-[calc(100%-24px)] pointer-events-none">
                {yTicks.map((_, i) => (
                  <div
                    key={i}
                    className="border-b border-slate-100 dark:border-slate-800/40 w-full first:border-t-0 last:border-b-2 last:border-slate-300 dark:last:border-slate-700"
                  />
                ))}
              </div>

              {/* Scrollable Bar Columns container */}
              <div className="absolute inset-0 flex items-stretch justify-between pl-2 overflow-x-auto scrollbar-thin pb-1">
                <div className="flex items-end justify-between w-full h-[calc(100%-24px)] gap-1 md:gap-2">
                  {monthlyData.map((data, index) => {
                    const revenuePercent = (data.revenue / maxRevenue) * 100;
                    const profitPercent = (data.profit / maxRevenue) * 100;

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center group relative min-w-[55px] sm:min-w-[70px] flex-grow h-full justify-end"
                      >
                        {/* Tooltip Card (Centered above the bar) */}
                        <div className="absolute z-30 bottom-full mb-3.5 hidden group-hover:flex flex-col bg-slate-900/95 dark:bg-black/95 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700/40 min-w-[180px] animate-fade-in pointer-events-none transition-all">
                          <div className="font-bold text-slate-200 border-b border-slate-700/60 pb-1 mb-1.5 text-center">
                            {data.label}
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>ရောင်းရငွေ:</span>
                              <span className="font-bold text-indigo-400">{formatKyat(data.revenue)}</span>
                            </div>
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>အမြတ်ငွေ:</span>
                              <span className="font-bold text-emerald-400">+{formatKyat(data.profit)}</span>
                            </div>
                            {data.revenue > 0 && (
                              <div className="flex justify-between gap-3 text-slate-300 pt-1.5 mt-0.5 border-t border-slate-800">
                                <span>အမြတ်နှုန်း:</span>
                                <span className="font-extrabold text-amber-400">
                                  {toMyanmarDigits(((data.profit / data.revenue) * 100).toFixed(0))}%
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-black/95"></div>
                        </div>

                        {/* The Candle / Bar container */}
                        <div className="relative w-8 sm:w-11 h-full flex items-end justify-center">
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${Math.max(revenuePercent, 2)}%` }}
                            className="absolute bottom-0 w-full bg-indigo-500/10 dark:bg-indigo-400/10 hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 rounded-t-lg transition-all duration-300 border border-indigo-500/15 dark:border-indigo-400/15"
                          />

                          {/* Profit Bar (Solid inside) */}
                          {data.profit > 0 && (
                            <div
                              style={{ height: `${Math.max(profitPercent, 2)}%` }}
                              className="absolute bottom-0 w-4 sm:w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 dark:from-emerald-600 dark:to-emerald-500 rounded-t-md transition-all duration-300 shadow-md shadow-emerald-500/10"
                            />
                          )}
                        </div>

                        {/* Bottom X-Axis Label */}
                        <div className="absolute top-full mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {data.label.split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Selling Brand Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white font-display text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              လစဉ် အရောင်းရဆုံး ဖုန်း Brand ပြဇယား (Pie Chart % ပြ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ဖုန်းတံဆိပ် (Brand) များအလိုက် ရောင်းချရမှု ရာခိုင်နှုန်းနှင့် အရောင်းစွမ်းဆောင်ရည် ခြုံငုံသုံးသပ်ချက်
            </p>
          </div>
        </div>

        {brandSalesData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-xl">
            <Award className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">အရောင်းရဆုံး Brand မှတ်တမ်းများ မရှိသေးပါ</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              ဖုန်းများကို စတင်ရောင်းချပြီးပါက လူကြိုက်အများဆုံး Brand များကို ဤနေရာတွင် အလိုအလျောက် သရုပ်ဖော်ပြသပေးမည် ဖြစ်ပါသည်။
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-2">
            {/* Left Column: Modern Pie Chart representation */}
            <div className="md:col-span-5 flex flex-col justify-center items-center gap-4 py-2">
              <svg viewBox="0 0 120 120" className="w-44 h-44 md:w-52 md:h-52 select-none overflow-visible">
                {/* Dynamic Brand Pie Slices */}
                {pieSlices.map((slice, idx) => {
                  const color = getBrandColor(slice.brand, idx);
                  const isHovered = hoveredBrandIndex === idx;
                  const sliceTransform = getSliceTransform(slice.middleAngle, isHovered);

                  return (
                    <path
                      key={idx}
                      d={slice.pathData}
                      fill={color}
                      stroke="white"
                      strokeWidth="1.2"
                      style={{
                        transform: sliceTransform,
                        transformOrigin: "60px 60px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      className="cursor-pointer hover:brightness-105 dark:stroke-slate-900"
                      onMouseEnter={() => setHoveredBrandIndex(idx)}
                      onMouseLeave={() => setHoveredBrandIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Information Widget positioned below the circle */}
              <div className="flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/40 shadow-sm px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 min-w-[160px] max-w-[200px] transition-all duration-300">
                {hoveredBrandIndex !== null ? (
                  <>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                      {pieSlices[hoveredBrandIndex].brand}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {toMyanmarDigits(pieSlices[hoveredBrandIndex].percentage.toFixed(1))}%
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
                      {toMyanmarDigits(pieSlices[hoveredBrandIndex].unitsSold)} လုံးရောင်းပြီး
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      စုစုပေါင်းရောင်းရ
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {toMyanmarDigits(totalBrandUnits)} လုံး
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 mt-0.5">
                      ၁၀၀% စုစုပေါင်း
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Premium Legend & Metrics List */}
            <div className="md:col-span-7 space-y-2.5">
              {pieSlices.map((slice, idx) => {
                const color = getBrandColor(slice.brand, idx);
                const isHovered = hoveredBrandIndex === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBrandIndex(idx)}
                    onMouseLeave={() => setHoveredBrandIndex(null)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? "bg-slate-50 dark:bg-slate-800/40 border-indigo-500/30 dark:border-indigo-400/30 scale-[1.01]"
                        : "bg-transparent border-slate-100/60 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color marker dot */}
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-all"
                        style={{ backgroundColor: color, transform: isHovered ? "scale(1.2)" : "scale(1)" }}
                      />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {slice.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-2 py-0.5 rounded-lg font-mono text-[10px]">
                        {toMyanmarDigits(slice.percentage.toFixed(1))}%
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold">
                        ရောင်းပြီး: <span className="font-extrabold text-sm" style={{ color: color }}>{toMyanmarDigits(slice.unitsSold)}</span> လုံး
                      </span>
                      <span className="text-slate-200 dark:text-slate-800 font-light">|</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        ရောင်းရငွေ: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKyat(slice.totalRevenue)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Sales List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">လတ်တလော အရောင်းလှုပ်ရှားမှုများ</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">အရောင်းစနစ်မှတစ်ဆင့် နောက်ဆုံးလုပ်ဆောင်ခဲ့သော အရောင်းမှတ်တမ်းများ</p>
          </div>
          <button
            onClick={() => setActiveTab("sold")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 group cursor-pointer"
          >
            အရောင်းမှတ်တမ်းအားလုံး ကြည့်ရန်
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex-grow overflow-x-auto">
          {recentSales.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6">
              <PackageCheck className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">အရောင်းမှတ်တမ်း မရှိသေးပါ</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                အရောင်းမှတ်တမ်း ပေါ်လာစေရန် ရောင်းရန်ရှိသော ဖုန်းတစ်လုံးကို အရင်ရောင်းချပေးပါ။
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    ဖုန်းအမျိုးအစား အသေးစိတ်
                  </th>
                  <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    ရောင်းချသည့်နေ့
                  </th>
                  <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                    ရောင်းဈေး
                  </th>
                  <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                    ရရှိသည့်အမြတ်
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {recentSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150">
                    <td className="py-3.5">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {sale.brand} {sale.model}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
                        <span className="font-mono">IMEI: {sale.imei}</span>
                        {sale.customerName && (
                          <>
                            <span>·</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-sans text-[10px]">
                              ဝယ်သူ: {sale.customerName}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {formatBurmeseDate(sale.saleDate)}
                    </td>
                    <td className="py-3.5 text-sm font-bold text-slate-900 dark:text-white text-right font-mono">
                      {formatKyat(sale.sellingPrice)}
                    </td>
                    <td className="py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right font-mono">
                      +{formatKyat(sale.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
