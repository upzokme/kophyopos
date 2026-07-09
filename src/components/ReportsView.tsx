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
import { MonthlyReport } from "../types.js";
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
}

export default function ReportsView({ sales }: ReportsViewProps) {
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

  // Dynamically compile years from available sales and current year
  const years = React.useMemo(() => {
    const saleYears = sales.map((s) => new Date(s.saleDate).getFullYear());
    const uniqueYears = Array.from(new Set([now.getFullYear(), ...saleYears])).sort((a, b) => b - a);
    return uniqueYears;
  }, [sales]);

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

  // Filter sales for the selected month to show list
  const monthlySalesBreakdown = React.useMemo(() => {
    return sales.filter((s) => {
      const d = new Date(s.saleDate);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [sales, selectedMonth, selectedYear]);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">လစဉ်အစီရင်ခံစာများ</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            ဘဏ္ဍာရေးရှင်းတမ်းများ၊ အမြတ်အစွန်းမှတ်တမ်းများနှင့် လက်ကျန်ဖုန်း တန်ဖိုးသတ်မှတ်ချက်များကို ကြည့်ရှုပြီး ပရင့်ထုတ်ပါ။
          </p>
        </div>

        <button
          onClick={printReport}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-all self-start sm:self-center text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          အစီရင်ခံစာ ပရင့်ထုတ်မည်
        </button>
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
                  +{formatKyat(report.totalProfit)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-4 font-semibold font-sans">
                {report.totalRevenue > 0 ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>အမြတ်ရာခိုင်နှုန်း {toMyanmarDigits(((report.totalProfit / report.totalRevenue) * 100).toFixed(0))}% ရှိသည်</span>
                  </>
                ) : (
                  <span>အမြတ်နှုန်း ၀%</span>
                )}
              </div>
            </div>

            {/* Current stock value carry-forward card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/20 hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                  လက်ရှိစတို လက်ကျန်တန်ဖိုး
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatKyat(report.currentStockValue)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium font-sans">
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span>ကျန်ရှိသော ဖုန်းများ၏ တန်ဖိုး</span>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white font-display text-base font-sans">
                လစဉ် အရောင်းစာရင်း အသေးစိတ် ({months[selectedMonth - 1].label}၊ {toMyanmarDigits(selectedYear)})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">ရွေးချယ်ထားသော လအတွင်း ရောင်းချခဲ့သော ဖုန်းတစ်လုံးချင်းစီ၏ အသေးစိတ် အရောင်းမှတ်တမ်းများ</p>
            </div>

            <div className="overflow-x-auto">
              {monthlySalesBreakdown.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs font-medium font-sans">
                  <Package className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  {toMyanmarDigits(selectedYear)} ခုနှစ်၊ {months[selectedMonth - 1].label} လအတွင်း ရောင်းချထားသော ဖုန်းမှတ်တမ်း မရှိပါ။
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">ဖုန်းအမျိုးအစား စပက်အသေးစိတ်</th>
                      <th className="pb-3 px-4">IMEI ဘားကုဒ်</th>
                      <th className="pb-3 px-4 text-right">ဝယ်ဈေး (အရင်း)</th>
                      <th className="pb-3 px-4 text-right">ရောင်းဈေး</th>
                      <th className="pb-3 pl-4 text-right">အသားတင် အမြတ်ငွေ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
                    {monthlySalesBreakdown.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors duration-150">
                        <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                          {sale.brand} {sale.model} <span className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">({sale.color})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{sale.imei}</td>
                        <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {formatKyat(sale.buyPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {formatKyat(sale.sellingPrice)}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
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
      )}
    </div>
  );
}
