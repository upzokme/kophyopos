/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import Layout from "./components/Layout";
import DashboardView from "./components/DashboardView";
import StockView from "./components/StockView";
import SoldView from "./components/SoldView";
import ReportsView from "./components/ReportsView";
import ToastContainer, { ToastMessage } from "./components/Toast";
import { Phone, Sale, DashboardStats, BrandModelColorOptions } from "./types";
import { RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Core POS states
  const [phones, setPhones] = useState<Phone[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [options, setOptions] = useState<BrandModelColorOptions>({
    brands: [],
    models: [],
    colors: [],
  });

  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto remove toast in 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all core POS data from server API
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [phonesRes, salesRes, statsRes, optionsRes] = await Promise.all([
        fetch("/api/phones"),
        fetch("/api/sales"),
        fetch("/api/dashboard"),
        fetch("/api/phones/options"),
      ]);

      if (!phonesRes.ok || !salesRes.ok || !statsRes.ok || !optionsRes.ok) {
        throw new Error("One or more server queries failed to resolve");
      }

      const [phonesData, salesData, statsData, optionsData] = await Promise.all([
        phonesRes.json(),
        salesRes.json(),
        statsRes.json(),
        optionsRes.json(),
      ]);

      setPhones(phonesData);
      setSales(salesData);
      setStats(statsData);
      setOptions(optionsData);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to synchronize state with server.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    fetchAllData();

    // Set theme based on local storage or dark mode preference
    const storedTheme = localStorage.getItem("phone-pos-theme") as "light" | "dark" | null;
    const initialTheme = storedTheme || "light";
    setTheme(initialTheme);

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [fetchAllData]);

  // Handle dark / light mode toggle
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("phone-pos-theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // --- API STATE MODIFICATIONS ---

  const handleAddPhone = async (phonePayload: Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }) => {
    const res = await fetch("/api/phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phonePayload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to register new phone.");
    }

    // Refresh state silently
    await fetchAllData(true);
  };

  const handleEditPhone = async (id: string, phonePayload: Partial<Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }>) => {
    const res = await fetch(`/api/phones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phonePayload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update phone specs.");
    }

    // Refresh state silently
    await fetchAllData(true);
  };

  const handleDeletePhone = async (id: string) => {
    const res = await fetch(`/api/phones/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to delete phone from stock.");
    }

    // Refresh state silently
    await fetchAllData(true);
  };

  const handleSellPhone = async (phoneId: string, customerName: string, sellingPrice: number, saleDate: string) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneId, customerName, sellingPrice, saleDate }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to record checkout sale.");
    }

    // Refresh state silently
    await fetchAllData(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "အရောင်းမှတ်တမ်း ဖျက်သိမ်း၍မရပါ။");
      }

      addToast("အရောင်းမှတ်တမ်းကို ပယ်ဖျက်ပြီး ဖုန်းကို လက်ကျန်စာရင်းထဲသို့ ပြန်ထည့်ပြီးပါပြီ။", "success");
      await fetchAllData(true);
    } catch (err: any) {
      addToast(err.message || "အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။", "error");
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 font-sans">အချက်အလက်များ ချိတ်ဆက်နေပါသည်...</p>
            <p className="text-xs text-zinc-400 mt-1 font-sans">အရောင်းစာရင်းနှင့် ဖုန်းလက်ကျန်များကို ဒေါင်းလုဒ်ဆွဲနေသည်</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "dashboard" && stats && (
            <DashboardView
              stats={stats}
              recentSales={sales as any}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "stock" && (
            <StockView
              phones={phones}
              options={options}
              onAddPhone={handleAddPhone}
              onEditPhone={handleEditPhone}
              onDeletePhone={handleDeletePhone}
              onSellPhone={handleSellPhone}
              onTriggerToast={addToast}
            />
          )}

          {activeTab === "sold" && (
            <SoldView sales={sales as any} onDeleteSale={handleDeleteSale} />
          )}

          {activeTab === "reports" && (
            <ReportsView sales={sales as any} />
          )}
        </>
      )}

      {/* Global Toast Drawer */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Layout>
  );
}
