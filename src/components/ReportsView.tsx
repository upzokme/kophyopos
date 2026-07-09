/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Warehouse,
  ShoppingBag,
  Download,
  Printer,
  ChevronRight,
  Package,
} from "lucide-react";
import { MonthlyReport, Phone } from "../types.js";
import { formatKyat, formatBurmeseDate, toMyanmarDigits } from "../utils.js";

interface SaleWithPhone {
  id: string;
  phoneId: string;
  customerName?: string;
  sellingPrice: number;
  profit: number;
  saleDate: string;
  brand: string;
  model: string;
  color: string;
  imei: string;
  buyPrice: number;
}

interface ReportsViewProps {
  sales: SaleWithPhone[];
  phones: Phone[];
  onResetData: () => void;
}

export default function ReportsView({ sales, phones, onResetData }: ReportsViewProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: "ဇန်နဝါရီ" },
    { value: 2, label: "ဖေဖော်ဝါရီ" },
    { value: 3, label: "မတ်" },
    { value: 4, label: "ဧပြီ" },
    { value: 5, label: "မေ" },
    { value: 6, label: "ဇွန်" },
    { value: 7, label: "ဇူလိုင်" },
    { value: 8, label: "ဩဂုတ်" },
    { value: 9, label: "စက်တင်ဘာ" },
    { value: 10, label: "အောက်တိုဘာ" },
    { value: 11, label: "နိုဝင်ဘာ" },
    { value: 12, label: "ဒီဇင်ဘာ" },
  ];

  // Dynamically compile years from available sales, phones and current year, up to 2030
  const years = React.useMemo(() => {
    const saleYears = sales.map((s) => new Date(s.saleDate).getFullYear());
    const phoneYears = phones.map((p) => new Date(p.createdAt).getFullYear());
    const allYears = [...saleYears, ...phoneYears, now.getFullYear(), 2026];
    const minYear = Math.min(...allYears.filter((y) => !isNaN(y)));
    const maxYear = 2030; // support up to 2030
    
    const uniqueYears: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      uniqueYears.push(y);
    }
    return uniqueYears;
  }, [sales, phones]);

  // Fetch report when filters change
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`);
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedMonth, selectedYear, sales]);

  const englishMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlySummaries = React.useMemo(() => {
    const dates = [
      ...sales.map((s) => new Date(s.saleDate).getTime()),
      ...phones.map((p) => new Date(p.createdAt).getTime())
    ].filter(t => !isNaN(t));

    if (dates.length === 0) return [];

    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);

    const minDate = new Date(minTime);
    const maxDate = new Date(maxTime);

    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth();
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    const list: { year: number; month: number }[] = [];

    let curYear = minYear;
    let curMonth = minMonth;

    while (curYear < maxYear || (curYear === maxYear && curMonth <= maxMonth)) {
      list.push({ year: curYear, month: curMonth });
      curMonth++;
      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }
    }

    return list.map(({ year, month }) => {
      const monthlySales = sales.filter((s) => {
        const d = new Date(s.saleDate);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const monthlyPhones = phones.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const totalCost = monthlySales.reduce((acc, s) => acc + s.buyPrice, 0);
      const totalProfit = monthlySales.reduce((acc, s) => acc + (s.profit || 0), 0);
      const totalRevenue = monthlySales.reduce((acc, s) => acc + s.sellingPrice, 0);

      return {
        year,
        month,
        inputCount: monthlyPhones.length,
        soldCount: monthlySales.length,
        totalCost,
        totalProfit,
        totalRevenue,
      };
    });
  }, [sales, phones]);

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">လစဉ်အစီရင်ခံစာများ</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            ဘဏ္ဍာရေးရှင်းတမ်းများ၊ အမြတ်အစွန်းမှတ်တမ်းများနှင့် လက်ကျန်ဖုန်း တန်ဖိုးသတ်မှတ်ချက်များကို ကြည့်ရှုပါ။
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">ရှာဖွေမည့် ကာလအပိုင်းအခြား:</span>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="flex-grow sm:flex-grow-0 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer font-sans"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer font-sans"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {toMyanmarDigits(y)} ခုနှစ်
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Report Metric Grids */}
      {loading || !report ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Phones Sold Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  ရောင်းချပြီးသည့်ဖုန်း
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  {toMyanmarDigits(report.phonesSold)} လုံး
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium font-sans">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span>ရွေးချယ်ထားသောကာလအတွင်း</span>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  စုစုပေါင်း အရောင်းရငွေ
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatKyat(report.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium font-sans">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span>ရောင်းရငွေ စုစုပေါင်းတန်ဖိုး</span>
              </div>
            </div>

            {/* Cost of Goods Sold Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  ကုန်ကျစရိတ် (အရင်း)
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatKyat(report.totalCost)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium font-sans">
                <Warehouse className="h-3.5 w-3.5 shrink-0" />
                <span>ဝယ်ယူခဲ့သော အရင်းစုစုပေါင်း</span>
              </div>
            </div>

            {/* Net profit card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between ring-1 ring-emerald-500/20 dark:ring-emerald-400/10 hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  အသားတင် အမြတ်ငွေ
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                  {formatKyat(report.totalProfit)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-4 font-medium font-sans">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>စုစုပေါင်း အသားတင် အမြတ်ငွေ</span>
              </div>
            </div>

            {/* Current stock value carry-forward card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/20 hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  လက်ကျန်ဖုန်းတန်ဖိုး (အရင်း)
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatKyat(report.currentStockValue)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium font-sans">
                <Warehouse className="h-3.5 w-3.5 shrink-0" />
                <span>ရောင်းရန်ကျန်ရှိသော ဖုန်းတန်ဖိုးစုစုပေါင်း</span>
              </div>
            </div>
          </div>

          {/* Breakdown Section - Monthly Sales & Stock Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white font-display text-base font-sans">
                လစဉ် အရောင်းစာရင်း အကျဉ်းချုပ် (စတင်ရောင်းချသည့် လမှ နောက်ဆုံးလအထိ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                စတင်ရောင်းချသည့် လမှစ၍ နောက်ဆုံးရောင်းချသည့်လအထိ လစဉ် အဝင်ဖုန်းအရေအတွက်၊ ရောင်းချပြီး ဖုန်းအရေအတွက်၊ ဝယ်ရင်းဈေးနှင့် အမြတ်ငွေစုစုပေါင်းဇယား
              </p>
            </div>

            <div className="overflow-x-auto">
              {monthlySummaries.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs font-medium font-sans">
                  <Package className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  ရောင်းချထားသော ဖုန်းမှတ်တမ်း မရှိသေးပါ။
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4 text-left">လအပိုင်းအခြား</th>
                      <th className="pb-3 px-4 text-center">အဝင်ဖုန်း</th>
                      <th className="pb-3 px-4 text-center">အရောင်း</th>
                      <th className="pb-3 px-4 text-right">အရင်းငွေစုစုပေါင်း</th>
                      <th className="pb-3 pl-4 text-right">အမြတ်ငွေစုစုပေါင်း</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
                    {monthlySummaries.map((summary, index) => {
                      const monthName = months[summary.month].label;
                      const englishName = englishMonths[summary.month];
                      const formattedPeriod = `${englishName} (${monthName}) - ${toMyanmarDigits(summary.year)}`;

                      return (
                        <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors duration-150">
                          <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                            {formattedPeriod}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {toMyanmarDigits(summary.inputCount)} လုံး
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {toMyanmarDigits(summary.soldCount)} လုံး
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                            {formatKyat(summary.totalCost)}
                          </td>
                          <td className="py-3.5 pl-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +{formatKyat(summary.totalProfit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
