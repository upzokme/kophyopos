/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Phone, PhoneStatus, BrandModelColorOptions } from "../types.js";
import { formatKyat, toMyanmarDigits, formatBurmeseDate } from "../utils.js";
import SellModal from "./SellModal.js";

interface StockViewProps {
  phones: Phone[];
  options: BrandModelColorOptions;
  onAddPhone: (phone: Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }) => Promise<void>;
  onEditPhone: (id: string, phone: Partial<Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }>) => Promise<void>;
  onDeletePhone: (id: string) => Promise<void>;
  onSellPhone: (phoneId: string, customerName: string, sellingPrice: number, saleDate: string) => Promise<void>;
  onTriggerToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function StockView({
  phones,
  options,
  onAddPhone,
  onEditPhone,
  onDeletePhone,
  onSellPhone,
  onTriggerToast,
}: StockViewProps) {
  // Available phones only
  const availablePhones = useMemo(() => {
    return phones.filter((p) => p.status === PhoneStatus.Available);
  }, [phones]);

  // Search and Date Filter State
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add / Edit Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);

  // Sell Modal State
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedSellPhone, setSelectedSellPhone] = useState<Phone | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Detail Pop-up Modal State
  const [selectedDetailPhone, setSelectedDetailPhone] = useState<Phone | null>(null);

  // Form Fields State
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [imei, setImei] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Helper to get local today formatted as YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Open Add Form
  const openAddForm = () => {
    setEditingPhone(null);
    setBrand("");
    setModel("");
    setColor("");
    setRam("");
    setStorage("");
    setImei("");
    setBuyPrice("");
    setSellPrice("");
    setCreatedAt(getTodayString());
    setFormError("");
    setFormOpen(true);
  };

  // Open Edit Form
  const openEditForm = (phone: Phone) => {
    setEditingPhone(phone);
    setBrand(phone.brand);
    setModel(phone.model);
    setColor(phone.color);
    setRam(phone.ram);
    setStorage(phone.storage);
    setImei(phone.imei);
    setBuyPrice(phone.buyPrice.toString());
    setSellPrice(phone.sellPrice.toString());
    setCreatedAt(phone.createdAt ? phone.createdAt.substring(0, 10) : getTodayString());
    setFormError("");
    setFormOpen(true);
  };

  // Close Form Modal
  const closeForm = () => {
    setFormOpen(false);
    setEditingPhone(null);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!brand.trim() || !model.trim() || !imei.trim()) {
      setFormError("တံဆိပ် (Brand)၊ မော်ဒယ် (Model) နှင့် IMEI တို့ကို မဖြစ်မနေ ဖြည့်သွင်းပေးရန် လိုအပ်ပါသည်။");
      return;
    }

    const parsedBuy = parseFloat(buyPrice);
    const parsedSell = parseFloat(sellPrice);

    if (isNaN(parsedBuy) || parsedBuy < 0) {
      setFormError("ဝယ်ဈေး (အရင်း) သည် အနှုတ်တန်ဖိုး မဖြစ်နိုင်ပါ။");
      return;
    }

    if (isNaN(parsedSell) || parsedSell < 0) {
      setFormError("ရောင်းဈေးသည် အနှုတ်တန်ဖိုး မဖြစ်နိုင်ပါ။");
      return;
    }

    if (imei.trim().length < 8) {
      setFormError("IMEI သည် အနည်းဆုံး ဂဏန်း ၈ လုံး ရှိရပါမည်။");
      return;
    }

    // Uniqueness local check
    const duplicate = phones.some(
      (p) => p.imei.toLowerCase() === imei.trim().toLowerCase() && (!editingPhone || p.id !== editingPhone.id)
    );
    if (duplicate) {
      setFormError(`IMEI "${imei}" သည် စနစ်ထဲတွင် စာရင်းသွင်းပြီးသား ဖြစ်နေပါသည်။`);
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim() || "N/A",
        ram: ram.trim() || "N/A",
        storage: storage.trim() || "N/A",
        imei: imei.trim(),
        buyPrice: parsedBuy,
        sellPrice: parsedSell,
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
      };

      if (editingPhone) {
        await onEditPhone(editingPhone.id, payload);
        onTriggerToast(`${brand} ${model} ၏ အချက်အလက်များကို ပြင်ဆင်ပြီးပါပြီ။`, "success");
      } else {
        await onAddPhone(payload);
        onTriggerToast(`${brand} ${model} အား လက်ကျန်စာရင်းထဲသို့ ထည့်သွင်းပြီးပါပြီ။`, "success");
      }
      closeForm();
    } catch (err: any) {
      setFormError(err.message || "အချက်အလက် သိမ်းဆည်းစဉ် အမှားအယွင်း ရှိပါသည်။");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await onDeletePhone(deleteConfirmId);
      onTriggerToast("ဖုန်းကို စာရင်းထဲမှ ဖျက်သိမ်းပြီးပါပြီ။", "success");
    } catch (err: any) {
      onTriggerToast(err.message || "ဖုန်းဖျက်သိမ်းမှု မအောင်မြင်ပါ", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Open Checkout Modal
  const openSellModal = (phone: Phone) => {
    setSelectedSellPhone(phone);
    setSellModalOpen(true);
  };

  // Filtering Logic (Removed other filters, only searching by brand, model, or imei, and date)
  const filteredAndSortedPhones = useMemo(() => {
    let result = [...availablePhones];

    // Search filter (Brand, Model, or IMEI per user request)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const combined = `${p.brand} ${p.model}`.toLowerCase();
        return (
          combined.includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.imei.toLowerCase().includes(q)
        );
      });
    }

    // Date Filter
    if (filterDate) {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        return p.createdAt.substring(0, 10) === filterDate;
      });
    }

    // Sort by newest added first (default and clean)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [availablePhones, search, filterDate]);

  // Pagination Logic
  const totalItems = filteredAndSortedPhones.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPhones = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPhones.slice(start, start + itemsPerPage);
  }, [filteredAndSortedPhones, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSellConfirm = async (customerName: string, sellingPrice: number, saleDate: string) => {
    if (!selectedSellPhone) return;
    await onSellPhone(selectedSellPhone.id, customerName, sellingPrice, saleDate);
    onTriggerToast(`${selectedSellPhone.brand} ${selectedSellPhone.model} အား ရောင်းချပြီးပါပြီ။`, "success");
  };

  const totalStockCount = availablePhones.length;
  const totalStockValue = useMemo(() => {
    return availablePhones.reduce((sum, p) => sum + p.buyPrice, 0);
  }, [availablePhones]);

  return (
    <div className="space-y-6 font-sans">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">ဖုန်းလက်ကျန်စာရင်း</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">လက်ရှိဆိုင်တွင်ရှိသော ရောင်းရန်ရှိသည့် ဖုန်းများကို စီမံခြင်း၊ ပြင်ဆင်ခြင်း၊ ဖျက်ခြင်းနှင့် စာရင်းသွင်းခြင်းများ ပြုလုပ်ပါ။</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 self-start sm:self-center cursor-pointer font-sans"
        >
          <Plus className="h-4 w-4" />
          ဖုန်းအသစ် ထည့်မည်
        </button>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
              ကျန်ရှိသော ဖုန်းအရေအတွက်
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {toMyanmarDigits(totalStockCount.toString())} လုံး
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 p-3 rounded-xl shrink-0">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
              ဝယ်ဈေးအရင်း စုစုပေါင်းတန်ဖိုး
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {formatKyat(totalStockValue)}
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 p-3 rounded-xl shrink-0 flex items-center justify-center w-12 h-12">
            <span className="text-sm font-extrabold font-sans">Ks</span>
          </div>
        </div>
      </div>

      {/* Search & Date Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Text Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="တံဆိပ် (Brand)၊ မော်ဒယ် (Model) သို့မဟုတ် IMEI ဘားကုဒ်ဖြင့် ရှာဖွေရန်..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
            />
          </div>

          {/* Date Search input */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full md:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono w-full md:w-48"
              />
            </div>
            {filterDate && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                ပြန်စဥ်းမည်
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {paginatedPhones.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6 font-sans">
              <Smartphone className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 font-display">လက်ကျန်ဖုန်းစာရင်း မရှိသေးပါ</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                ရှာဖွေမှုစာလုံးကို ပြန်ဖျက်ပါ သို့မဟုတ် ဖုန်းအသစ် စာရင်းသွင်းရန် 'ဖုန်းအသစ် ထည့်မည်' ခလုတ်ကို နှိပ်ပါ။
              </p>
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  ရှာဖွေမှု အားလုံးပယ်ဖျက်မည်
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                  <th className="py-4 px-6">ဖုန်းအမျိုးအစားနှင့် စပက်များ</th>
                  <th className="py-4 px-6">စာရင်းသွင်းသည့်ရက်စွဲ</th>
                  <th className="py-4 px-6 text-center">အခြေအနေ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {paginatedPhones.map((phone) => (
                  <tr
                    key={phone.id}
                    onClick={() => setSelectedDetailPhone(phone)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 group transition-all duration-150 cursor-pointer"
                  >
                    {/* Device details */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {phone.brand} {phone.model}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium font-sans">
                        <span>{phone.color}</span>
                        <span>·</span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          RAM: {phone.ram} / Storage: {phone.storage}
                        </span>
                      </div>
                    </td>

                    {/* Date of Entry */}
                    <td className="py-4 px-6">
                      <span className="inline-block text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        {phone.createdAt
                          ? formatBurmeseDate(phone.createdAt)
                          : "သတ်မှတ်မထားပါ"}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6 text-center font-sans">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                        ရောင်းရန်ရှိသည်
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-50/30 dark:bg-slate-900">
            <span>
              စုစုပေါင်း ဖုန်း <strong className="text-slate-700 dark:text-slate-300">{toMyanmarDigits(totalItems)}</strong> လုံးအနက် <strong className="text-slate-700 dark:text-slate-300">{toMyanmarDigits((currentPage - 1) * itemsPerPage + 1)}</strong> မှ{" "}
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

      {/* Slide-over or Modal for ADD / EDIT */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div
            onClick={closeForm}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 p-2 rounded-xl">
                  <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">
                    {editingPhone ? "ဖုန်းအချက်အလက် ပြင်ဆင်ရန်" : "ဖုန်းအသစ် စာရင်းသွင်းရန်"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ဖုန်းအမျိုးအစားနှင့် ဝယ်ဈေး၊ ရောင်းဈေးများကို ဖြည့်သွင်းပါ</p>
                </div>
              </div>
              <button
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            {formError && (
              <div className="m-6 mb-0 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    တံဆိပ် (Brand) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ဥပမာ - Apple၊ Samsung"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    မော်ဒယ် (Model) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ဥပမာ - iPhone 15 Pro"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    အရောင်
                  </label>
                  <input
                    type="text"
                    placeholder="ဥပမာ - Black"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* RAM */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    RAM
                  </label>
                  <input
                    type="text"
                    placeholder="ဥပမာ - 8GB"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                {/* Storage */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Storage
                  </label>
                  <input
                    type="text"
                    placeholder="ဥပမာ - 256GB"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* IMEI */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  IMEI ဘားကုဒ် *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ဂဏန်း/စာလုံးများ (တန်ဖိုးမတူညီရပါ)"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Buy Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    ဝယ်ဈေး (အရင်း) *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                      Ks
                    </div>
                    <input
                      type="number"
                      required
                      placeholder="ဝယ်ဈေးထည့်ပါ"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    ရောင်းဈေး *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                      Ks
                    </div>
                    <input
                      type="number"
                      required
                      placeholder="ရောင်းဈေးထည့်ပါ"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Date of Entry */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  စာရင်းသွင်းသည့်ရက်စွဲ *
                </label>
                <input
                  type="date"
                  required
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
                >
                  {formSubmitting ? "လုပ်ဆောင်နေပါသည်..." : "သိမ်းဆည်းမည်"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div
            onClick={() => setDeleteConfirmId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 p-2 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">ဖုန်းစာရင်း ဖျက်သိမ်းခြင်း</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ဤဖုန်းကို စာရင်းထဲမှ ဖျက်ပစ်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်သည် စာရင်းမှ အပြီးအပိုင် ဖျက်ပစ်မည်ဖြစ်ပြီး ပြန်လည်ရယူ၍ မရနိုင်ပါ။
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                ဖျက်သိမ်းမှုကို အတည်ပြုမည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal overlay */}
      <SellModal
        phone={selectedSellPhone}
        isOpen={sellModalOpen}
        onClose={() => {
          setSellModalOpen(false);
          setSelectedSellPhone(null);
        }}
        onConfirm={handleSellConfirm}
      />

      {/* Detail Pop-up Modal */}
      {selectedDetailPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div
            onClick={() => setSelectedDetailPhone(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 p-2 rounded-xl">
                  <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">
                    ဖုန်းအချက်အလက် အသေးစိတ်
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ဖုန်း၏ အသေးစိတ် အချက်အလက်များနှင့် လုပ်ဆောင်ချက်များ</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailPhone(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Brand & Model */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ဖုန်းအမျိုးအစားနှင့် စပက်များ
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl">
                  <div className="font-extrabold text-slate-900 dark:text-white text-base">
                    {selectedDetailPhone.brand} {selectedDetailPhone.model}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    <span>အရောင်: {selectedDetailPhone.color}</span>
                    <span>·</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">
                      RAM: {selectedDetailPhone.ram} / Storage: {selectedDetailPhone.storage}
                    </span>
                  </div>
                </div>
              </div>

              {/* IMEI */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  IMEI ဘားကုဒ်
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono text-sm text-slate-800 dark:text-slate-200">
                  {selectedDetailPhone.imei}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Buy Price */}
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    ဝယ်ဈေး (အရင်း)
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatKyat(selectedDetailPhone.buyPrice)}
                  </div>
                </div>

                {/* Sell Price */}
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    ရောင်းဈေး
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatKyat(selectedDetailPhone.sellPrice)}
                  </div>
                </div>
              </div>

              {/* Date of Entry */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  စာရင်းသွင်းသည့်ရက်စွဲ
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 p-3 rounded-xl flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-medium font-sans">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    {selectedDetailPhone.createdAt
                      ? formatBurmeseDate(selectedDetailPhone.createdAt)
                      : "သတ်မှတ်မထားပါ"}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  အခြေအနေ
                </span>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    ရောင်းရန်ရှိသည်
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  လုပ်ဆောင်ချက်
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const p = selectedDetailPhone;
                      setSelectedDetailPhone(null);
                      openSellModal(p);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                  >
                    ရောင်းမည်
                  </button>
                  <button
                    onClick={() => {
                      const p = selectedDetailPhone;
                      setSelectedDetailPhone(null);
                      openEditForm(p);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    ပြင်ဆင်မည်
                  </button>
                  <button
                    onClick={() => {
                      const p = selectedDetailPhone;
                      setSelectedDetailPhone(null);
                      setDeleteConfirmId(p.id);
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    ဖျက်မည်
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
