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
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [selectedDetailSale, setSelectedDetailSale] = useState<SoldPhone | null>(null);
  const itemsPerPage = 8;

  // Filter sold history by IMEI, Model, or Sale Date (Calendar)
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
          sale.imei.toLowerCase().includes(q)
        );
      });
    }

    if (selectedDate) {
      result = result.filter((sale) => {
        const d = new Date(sale.saleDate);
        const yyyymmdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return yyyymmdd === selectedDate;
      });
    }

    // Sort by newest sale date first
    result.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    return result;
  }, [sales, search, selectedDate]);

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
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ရောင်းပြီးသမျှ ဖုန်းအရေအတွက်</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-2">{toMyanmarDigits(filteredSales.length)} လုံး</span>
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

      {/* Filters (Search & Calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="တံဆိပ်၊ မော်ဒယ် သို့မဟုတ် IMEI ဘားကုဒ်ဖြင့် ရှာဖွေရန်..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Calendar Picker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center">
          <div className="relative w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 scheme-light dark:scheme-dark cursor-pointer"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate("");
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="ရက်စွဲ စစ်ထုတ်မှုကို ပယ်ဖျက်ရန်"
              >
                အားလုံးပြန်ပြရန်
              </button>
            )}
          </div>
        </div>
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
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 font-medium">
                          <span>အရောင်: {sale.color}</span>
                          {sale.customerName && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                ဝယ်သူ: {sale.customerName}
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
            <div className="p-6 space-y-4">
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
                    {selectedDetailSale.customerName && (
                      <>
                        <span>·</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-sans text-slate-700 dark:text-slate-300">
                          ဝယ်သူ: {selectedDetailSale.customerName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
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
                      setCancelConfirmId(id);
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
    </div>
  );
}
