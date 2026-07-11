/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Smartphone,
  Receipt,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
  Store,
  LogOut,
  Trash2,
  Lock,
} from "lucide-react";

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout?: () => void;
  onResetData?: () => Promise<void>;
  children: React.ReactNode;
}

export default function Layout({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onLogout,
  onResetData,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "stock", label: "ဖုန်းလက်ကျန်စာရင်း", icon: Smartphone },
    { id: "sold", label: "အရောင်းမှတ်တမ်းများ", icon: Receipt },
    { id: "reports", label: "လစဉ်အစီရင်ခံစာများ", icon: BarChart3 },
  ];

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordInput !== "phyomobilereset2026@") {
      setPasswordError("Secondary Password မှားယွင်းနေပါသည်။");
      return;
    }

    setIsResetting(true);
    try {
      if (onResetData) {
        await onResetData();
      }
      setShowResetModal(false);
    } catch (err: any) {
      setPasswordError(err.message || "အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 text-slate-100 border-r border-slate-800/60 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-600/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm tracking-tight">Ko Phyo Mobile Shop</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">စနစ်အဆင်သင့်ဖြစ်ပါသည်</p>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}

          {onResetData && (
            <button
              onClick={() => {
                setShowResetModal(true);
                setPasswordInput("");
                setPasswordError("");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-amber-500 hover:text-amber-400 hover:bg-amber-950/20 mt-4 border border-amber-950/20"
            >
              <Trash2 className="h-4 w-4 shrink-0 text-amber-500" />
              ဒေတာအားလုံးဖျက်ရန် (Reset)
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 mt-2 border border-rose-950/20"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              လော့ဂ်အောက်ထွက်ရန်
            </button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">ဒေတာသိမ်းဆည်းပြီး</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Header / Nav */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="md:hidden h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md shadow-indigo-600/10">
              <Smartphone className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-sm text-white">Ko Phyo Mobile Shop</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-sm z-30 transition-all">
            <nav className="bg-slate-900 border-b border-slate-850 p-4 space-y-1 shadow-lg text-white">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}

              {onResetData && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowResetModal(true);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-amber-500 hover:bg-amber-950/20 mt-4 border border-amber-950/20"
                >
                  <Trash2 className="h-4 w-4 shrink-0 text-amber-500" />
                  ဒေတာအားလုံးဖျက်ရန် (Reset)
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-rose-400 hover:bg-rose-950/20 mt-2 border border-rose-950/20"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  လော့ဂ်အောက်ထွက်ရန်
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Reset Data Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isResetting) setShowResetModal(false);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 overflow-hidden text-slate-900 dark:text-slate-100 z-10"
            >
              {/* Header */}
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-950 dark:text-white">ဒေတာအားလုံးဖျက်ရန် (Reset System)</h3>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono tracking-wider uppercase">အရန်လျှို့ဝှက်နံပါတ် တောင်းဆိုချက်</p>
                </div>
              </div>

              {/* Warning Content */}
              <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl">
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed font-semibold">
                  သတိပေးချက်- စနစ်အတွင်းရှိ ဖုန်းလက်ကျန်များ၊ အရောင်းမှတ်တမ်းများနှင့် လစဉ်အစီရင်ခံစာများ အားလုံး အပြီးတိုင် ပျက်ပြယ်သွားမည်ဖြစ်ပြီး ပြန်လည်ရယူနိုင်တော့မည်မဟုတ်ပါ။
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Reset Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="Reset Password ကိုရိုက်ထည့်ပါ"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      disabled={isResetting}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                  >
                    မလုပ်တော့ပါ
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting || !passwordInput}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-md shadow-rose-600/10 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isResetting ? "ဖျက်နေပါသည်..." : "အပြီးတိုင်ဖျက်မည်"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
