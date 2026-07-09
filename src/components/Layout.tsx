/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
} from "lucide-react";

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  children: React.ReactNode;
}

export default function Layout({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "ပင်မစာမျက်နှာ", icon: LayoutDashboard },
    { id: "stock", label: "ဖုန်းလက်ကျန်စာရင်း", icon: Smartphone },
    { id: "sold", label: "အရောင်းမှတ်တမ်းများ", icon: Receipt },
    { id: "reports", label: "လစဉ်အစီရင်ခံစာများ", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 text-slate-100 border-r border-slate-800/60 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-600/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm tracking-tight">ဖုန်းဆိုင် POS စနစ်</h1>
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
              <Store className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-sm text-white">ဖုန်းဆိုင် POS စနစ်</span>
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
            </nav>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
