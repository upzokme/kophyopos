/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, DollarSign, Calendar, User, Phone as PhoneIcon, MapPin, Gift } from "lucide-react";
import { Phone } from "../types.js";
import { formatKyat, toMyanmarDigits } from "../utils.js";

interface SellModalProps {
  phone: Phone | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    hasCover: boolean,
    hasScreenProtector: boolean,
    hasCharger: boolean,
    sellingPrice: number,
    saleDate: string
  ) => Promise<void>;
}

export default function SellModal({ phone, isOpen, onClose, onConfirm }: SellModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [hasCover, setHasCover] = useState(false);
  const [hasScreenProtector, setHasScreenProtector] = useState(false);
  const [hasCharger, setHasCharger] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Set defaults when phone changes
  useEffect(() => {
    if (phone) {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setHasCover(false);
      setHasScreenProtector(false);
      setHasCharger(false);
      setSellingPrice(phone.sellPrice.toString());
      // Set to today (local time YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0];
      setSaleDate(today);
      setError("");
    }
  }, [phone]);

  if (!phone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const price = parseFloat(sellingPrice);
    if (isNaN(price)) {
      setError("ကျေးဇူးပြု၍ မှန်ကန်သော ရောင်းဈေးကို ထည့်သွင်းပေးပါ။");
      return;
    }

    if (price < 0) {
      setError("ရောင်းဈေးသည် အနှုတ်တန်ဖိုး မဖြစ်နိုင်ပါ။");
      return;
    }

    if (!saleDate) {
      setError("ကျေးဇူးပြု၍ ရောင်းချသည့်ရက်စွဲကို ရွေးချယ်ပေးပါ။");
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(customerName, customerPhone, customerAddress, hasCover, hasScreenProtector, hasCharger, price, saleDate);
      onClose();
    } catch (err: any) {
      setError(err.message || "ရောင်းချမှုစာရင်း သွင်းရာတွင် အမှားအယွင်းရှိပါသည်။");
    } finally {
      setSubmitting(false);
    }
  };

  const expectedProfit = parseFloat(sellingPrice) ? parseFloat(sellingPrice) - phone.buyPrice : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[88vh] md:max-h-[85vh] shadow-xl overflow-hidden z-10 font-sans flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 p-2 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">ဖုန်းရောင်းချရန် (Checkout)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{phone.brand} {phone.model} အား ရောင်းချမှုစာရင်းသွင်းရန်</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
              {/* Scrollable Fields Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Phone Quick Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/80 rounded-xl grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider font-bold text-[9px] font-sans">ဖုန်းအမျိုးအစား</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {phone.brand} {phone.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider font-bold text-[9px] font-sans">IMEI ဘားကုဒ်</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {phone.imei}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider font-bold text-[9px] font-sans">စပက်အချက်အလက်</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium font-sans">
                      RAM: {phone.ram} / Storage: {phone.storage} · {phone.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider font-bold text-[9px] font-sans">ဝယ်ဈေး (အရင်း)</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatKyat(phone.buyPrice)}
                    </span>
                  </div>
                </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 rounded-xl text-xs font-medium font-sans">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">
                    ဝယ်သူအမည်
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="ဥပမာ - ဦးမောင်မောင်"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
                    />
                  </div>
                </div>

                {/* Customer Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">
                      ဖုန်းနံပတ်
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="tel"
                        placeholder="ဥပမာ - ၀၉xxxxxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">
                      နေရပ်လိပ်စာ
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="ဥပမာ - ရန်ကုန်မြို့"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Gifts / Accessories Toggles */}
                <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 font-sans flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-indigo-500" />
                    လက်ဆောင်အပိုပစ္စည်းများ (Accessories)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasCover}
                        onChange={(e) => setHasCover(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Cover ဖုန်းခွံ</span>
                    </label>

                    <label className="flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasScreenProtector}
                        onChange={(e) => setHasScreenProtector(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>မှန်ကပ်</span>
                    </label>

                    <label className="flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasCharger}
                        onChange={(e) => setHasCharger(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Charger</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">
                      ရောင်းဈေး (ကျပ်ငွေ) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        Ks
                      </div>
                      <input
                        type="number"
                        required
                        placeholder="ရောင်းဈေးထည့်ပါ"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Sale Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">
                      ရောင်းချသည့်ရက်စွဲ *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="date"
                        required
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Indicator */}
              {!isNaN(expectedProfit) && (
                <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
                  expectedProfit >= 0
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30"
                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30"
                }`}>
                  <span className="font-sans">ခန့်မှန်းရရှိမည့်အမြတ်</span>
                  <span className="text-sm font-bold">
                    {expectedProfit >= 0 ? "+" : ""}{formatKyat(expectedProfit)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 justify-end p-5 sm:px-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-800 font-sans shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "လုပ်ဆောင်နေပါသည်..." : "ရောင်းချမှု အတည်ပြုမည်"}
              </button>
            </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
