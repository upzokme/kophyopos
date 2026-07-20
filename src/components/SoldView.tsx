/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trash2,
  AlertTriangle,
  X,
  Smartphone,
} from "lucide-react";
import { Sale } from "../types.js";
import { formatKyat, formatBurmeseDate, toMyanmarDigits } from "../utils.js";

// Extended Sale structure with joined phone specs
interface SoldPhone extends Sale {
  brand: string;
  model: string;
  color: string;
  imei: string;
  buyPrice: number;
}

interface SoldViewProps {
  sales: SoldPhone[];
  onDeleteSale?: (saleId: string) => void;
}

export default function SoldView({ sales, onDeleteSale }: SoldViewProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "daily" | "monthly">("all");
  const [selectedDate, setSelectedDate] = useState("");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [selectedDetailSale, setSelectedDetailSale] = useState<SoldPhone | null>(null);

  // Secondary Password Verification State
  const [secPasswordAction, setSecPasswordAction] = useState<{
    type: "cancel-sale";
    saleId: string;
  } | null>(null);
  const [secPasswordInput, setSecPasswordInput] = useState("");
  const [secPasswordError, setSecPasswordError] = useState("");

  const months = [
    { value: 1, label: "ဇန်နဝါရီ (January)" },
    { value: 2, label: "ဖေဖော်ဝါရီ (February)" },
    { value: 3, label: "မတ် (March)" },
    { value: 4, label: "ဧပြီ (April)" },
    { value: 5, label: "မေ (May)" },
    { value: 6, label: "ဇွန် (June)" },
    { value: 7, label: "ဇူလိုင် (July)" },
    { value: 8, label: "ဩဂုတ် (August)" },
    { value: 9, label: "စက်တင်ဘာ (September)" },
    { value: 10, label: "အောက်တိုဘာ (October)" },
    { value: 11, label: "နိုဝင်ဘာ (November)" },
    { value: 12, label: "ဒီဇင်ဘာ (December)" },
  ];

  const years = useMemo(() => {
    const saleYears = sales.map((s) => new Date(s.saleDate).getFullYear());
    const allYears = [...saleYears, now.getFullYear(), 2026];
    const minYear = Math.min(...allYears.filter((y) => !isNaN(y)));
    const maxYear = 2030; // support up to 2030
    
    const uniqueYears: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      uniqueYears.push(y);
    }
    return uniqueYears;
  }, [sales, now]);
  const itemsPerPage = 8;

  // Filter sold history by Search, and Daily / Monthly constraints
  const filteredSales = useMemo(() => {
    let result = [...sales];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((sale) => {
        const combined = `${sale.brand} ${sale.model}`.toLowerCase();
        return (
          combined.includes(q) ||
          sale.brand.toLowerCase().includes(q) ||
          sale.model.toLowerCase().includes(q) ||
          sale.imei.toLowerCase().includes(q) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(q))
        );
      });
    }

    if (filterType === "daily" && selectedDate) {
      result = result.filter((sale) => {
        const d = new Date(sale.saleDate);
        const yyyymmdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return yyyymmdd === selectedDate;
      });
    } else if (filterType === "monthly") {
      result = result.filter((sale) => {
        const d = new Date(sale.saleDate);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
      });
    }

    // Sort by newest sale date first
    result.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    return result;
  }, [sales, search, filterType, selectedDate, selectedMonth, selectedYear]);

  // Pagination Logic
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate quick metrics for this view
  const totalProfit = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.profit, 0);
  }, [filteredSales]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.sellingPrice, 0);
  }, [filteredSales]);

  const totalCost = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.buyPrice || 0), 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6 font-sans">
      {/* Title block */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">အရောင်းမှတ်တမ်းများ</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">ရောင်းချပြီးသမျှ အရောင်းမှတ်တမ်းများအားလုံးကို ကြည့်ရှုစစ်ဆေးခြင်း၊ အမြတ်တွက်ခြင်းနှင့် ဝယ်သူများကို ရှာဖွေခြင်း။</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ရောင်းပြီးသမျှ ဖုန်းအရေအတွက်</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-2">{toMyanmarDigits(filteredSales.length)} လုံး</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 block">ဝယ်ရင်းဈေး အရင်းတန်ဖိုး: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatKyat(totalCost)}</span></span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">စုစုပေါင်း ရောင်းရငွေ</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-display">{formatKyat(totalRevenue)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">စုစုပေါင်း အမြတ်ငွေ</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-display">+{formatKyat(totalProfit)}</span>
        </div>
      </div>

      {/* Search and Filters Card (Daily & Monthly Searching) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="တံဆိပ်၊ မော်ဒယ်၊ IMEI သို့မဟုတ် ဝယ်သူအမည်ဖြင့် ရှာဖွေရန်..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Filter Type Toggle Button Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl items-center border border-slate-200/40 dark:border-slate-800/30">
            <button
              onClick={() => {
                setFilterType("all");
                setCurrentPage(1);
              }}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              အားလုံး
            </button>
            <button
              onClick={() => {
                setFilterType("daily");
                setCurrentPage(1);
              }}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === "daily"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              နေ့အလိုက် (Daily)
            </button>
            <button
              onClick={() => {
                setFilterType("monthly");
                setCurrentPage(1);
              }}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === "monthly"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              လအလိုက် (Monthly)
            </button>
          </div>
        </div>

        {/* Dynamic Secondary Filters */}
        {filterType === "daily" && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-150 dark:border-slate-800/50 animate-fade-in">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">နေ့စွဲ ရွေးချယ်ရန်:</span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 scheme-light dark:scheme-dark cursor-pointer"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate("");
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                ပြန်လည်သတ်မှတ်မည် (Reset)
              </button>
            )}
          </div>
        )}

        {filterType === "monthly" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 bg-slate-50/60 dark:bg-slate-800/20 p-4.5 rounded-xl border border-slate-200/60 dark:border-slate-800/50 animate-fade-in">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ရှာဖွေလိုသည့် လနှင့်ခုနှစ်ရွေးရန်:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center">
              {/* Month Selection Dropdown */}
              <div className="relative w-full sm:w-56">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 cursor-pointer shadow-sm appearance-none"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Year Selection Dropdown */}
              <div className="relative w-full sm:w-40">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 cursor-pointer shadow-sm appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {toMyanmarDigits(y)} ခုနှစ်
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {paginatedSales.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6">
              <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 font-display">အရောင်းမှတ်တမ်းများ မရှိသေးပါ</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                ရောင်းချပြီးသော ဖုန်းမှတ်တမ်းများကိုသာ ဤနေရာ၌ စာရင်းပြုစုပြသပေးမည် ဖြစ်ပါသည်။
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                  <th className="py-4 px-6">ရောင်းချပြီးသော ဖုန်း</th>
                  <th className="py-4 px-6">ရောင်းချသည့်ရက်စွဲ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {paginatedSales.map((sale) => {
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedDetailSale(sale)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 group transition-all duration-150 cursor-pointer"
                    >
                      {/* Brand, Model, Color, Customer */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {sale.brand} {sale.model}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex flex-wrap items-center gap-1 sm:gap-2 font-medium">
                          <span>အရောင်: {sale.color}</span>
                          {sale.customerName && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-sans">
                                ဝယ်သူ: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Sale Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {formatBurmeseDate(sale.saleDate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-50/30 dark:bg-slate-900">
            <span>
              စုစုပေါင်း အရောင်းမှတ်တမ်း <strong className="text-slate-700 dark:text-slate-300">{toMyanmarDigits(totalItems)}</strong> ခုအနက် <strong className="text-slate-700 dark:text-slate-300">{toMyanmarDigits((currentPage - 1) * itemsPerPage + 1)}</strong> မှ{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {toMyanmarDigits(Math.min(currentPage * itemsPerPage, totalItems))}
              </strong>{" "}
              ထိ ပြသနေပါသည်
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {toMyanmarDigits(idx + 1)}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Cancelling Sale */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div
            onClick={() => setCancelConfirmId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 p-2 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">အရောင်းမှတ်တမ်း ပယ်ဖျက်ခြင်း</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ဤအရောင်းမှတ်တမ်းကို ပယ်ဖျက်ပြီး ဖုန်းကို လက်ကျန်စာရင်းထဲသို့ မူလသတ်မှတ်ချက်များအတိုင်း ပြန်ထည့်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်သည် အရောင်းစာရင်းမှ အပြီးအပိုင်ဖျက်သိမ်းမည် ဖြစ်သည်။
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                onClick={() => {
                  if (onDeleteSale) {
                    onDeleteSale(cancelConfirmId);
                  }
                  setCancelConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                အရောင်းပယ်ဖျက်မှုကို အတည်ပြုမည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sold Detail Pop-up Modal */}
      {selectedDetailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div
            onClick={() => setSelectedDetailSale(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 p-2 rounded-xl">
                  <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">
                    အရောင်းမှတ်တမ်း အသေးစိတ်
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ရောင်းချပြီးသော ဖုန်း၏ အရောင်းဆိုင်ရာ အသေးစိတ်အချက်အလက်များ</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailSale(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Sold Phone Info */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ရောင်းချပြီးသော ဖုန်း
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl">
                  <div className="font-extrabold text-slate-900 dark:text-white text-base">
                    {selectedDetailSale.brand} {selectedDetailSale.model}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    <span>အရောင်: {selectedDetailSale.color}</span>
                  </div>
                </div>
              </div>

              {/* Customer Contact & Address Info */}
              {(selectedDetailSale.customerName || selectedDetailSale.customerPhone || selectedDetailSale.customerAddress) && (
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 font-sans">
                    ဝယ်သူ အချက်အလက် (Customer Details)
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3.5 rounded-xl space-y-2 text-xs">
                    {selectedDetailSale.customerName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-sans">ဝယ်သူအမည်:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{selectedDetailSale.customerName}</span>
                      </div>
                    )}
                    {selectedDetailSale.customerPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-sans">ဖုန်းနံပတ်:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{selectedDetailSale.customerPhone}</span>
                      </div>
                    )}
                    {selectedDetailSale.customerAddress && (
                      <div className="flex items-start justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-sans">နေရပ်လိပ်စာ:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[200px] break-words font-sans">{selectedDetailSale.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Free Gifts / Accessories */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 font-sans">
                  ထည့်ပေးလိုက်သည့် လက်ဆောင်ပစ္စည်းများ
                </span>
                {(selectedDetailSale.hasCover || selectedDetailSale.hasScreenProtector || selectedDetailSale.hasCharger) ? (
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl flex flex-wrap gap-2">
                    {selectedDetailSale.hasCover && (
                      <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/30">
                        Cover ဖုန်းခွံ
                      </span>
                    )}
                    {selectedDetailSale.hasScreenProtector && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-100 dark:border-emerald-900/30">
                        မှန်ကပ်
                      </span>
                    )}
                    {selectedDetailSale.hasCharger && (
                      <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-100 dark:border-amber-900/30">
                        Charger
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">
                    လက်ဆောင် ထည့်သွင်းပေးထားခြင်း မရှိပါ။
                  </div>
                )}
              </div>

              {/* IMEI */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  IMEI ဘားကုဒ်
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono text-sm text-slate-800 dark:text-slate-200">
                  {selectedDetailSale.imei}
                </div>
              </div>

              {/* Sale Date */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ရောင်းချသည့်ရက်စွဲ
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{formatBurmeseDate(selectedDetailSale.saleDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Buy Price */}
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    ဝယ်ဈေး (အရင်း)
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatKyat(selectedDetailSale.buyPrice)}
                  </div>
                </div>

                {/* Sell Price */}
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    ရောင်းဈေး
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono font-extrabold text-slate-900 dark:text-white">
                    {formatKyat(selectedDetailSale.sellingPrice)}
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ရရှိသည့်အမြတ်
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl flex items-center gap-2 font-mono font-extrabold">
                  <span className={selectedDetailSale.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {selectedDetailSale.profit >= 0 ? "+" : ""}
                    {formatKyat(selectedDetailSale.profit)}
                  </span>
                </div>
              </div>

              {/* Action - Delete Sale */}
              {onDeleteSale && (
                <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    လုပ်ဆောင်ချက်
                  </span>
                  <button
                    onClick={() => {
                      const id = selectedDetailSale.id;
                      setSelectedDetailSale(null);
                      setSecPasswordAction({ type: "cancel-sale", saleId: id });
                    }}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer text-center font-sans"
                  >
                    အရောင်းပယ်ဖျက်မည်
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Password Verification Dialog */}
      {secPasswordAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div
            onClick={() => {
              setSecPasswordAction(null);
              setSecPasswordInput("");
              setSecPasswordError("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 p-2 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">Secondary Password လိုအပ်ပါသည်</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  အရောင်းပယ်ဖျက်ခြင်း လုပ်ဆောင်ချက်အတွက် Secondary Password ဖြည့်သွင်းရန် လိုအပ်ပါသည်။
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (secPasswordInput === "2510") {
                  const targetSaleId = secPasswordAction.saleId;
                  setSecPasswordAction(null);
                  setSecPasswordInput("");
                  setSecPasswordError("");
                  setCancelConfirmId(targetSaleId);
                } else {
                  setSecPasswordError("Secondary Password မှားယွင်းနေပါသည်။");
                }
              }}
              className="space-y-3"
            >
              <input
                type="password"
                required
                autoFocus
                placeholder="Secondary Password ထည့်ပါ"
                value={secPasswordInput}
                onChange={(e) => {
                  setSecPasswordInput(e.target.value);
                  setSecPasswordError("");
                }}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
              />

              {secPasswordError && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{secPasswordError}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSecPasswordAction(null);
                    setSecPasswordInput("");
                    setSecPasswordError("");
                  }}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  အတည်ပြုမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
