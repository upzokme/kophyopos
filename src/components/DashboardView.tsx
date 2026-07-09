/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Smartphone,
  CheckCircle,
  ShoppingBag,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRight,
  PackageCheck,
} from "lucide-react";
import { DashboardStats, Sale } from "../types.js";
import { formatKyat, formatBurmeseDate, toMyanmarDigits } from "../utils.js";

interface DashboardViewProps {
  stats: DashboardStats;
  recentSales: (Sale & { brand: string; model: string; color: string; imei: string })[];
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ stats, recentSales, setActiveTab }: DashboardViewProps) {
  const statCards = [
    {
      title: "ဖုန်းစုစုပေါင်း",
      value: `${toMyanmarDigits(stats.totalPhones)} လုံး`,
      icon: Smartphone,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
      description: "စာရင်းသွင်းထားသမျှ ဖုန်းစုစုပေါင်း",
      tab: "stock",
    },
    {
      title: "ရောင်းရန်ရှိသော လက်ကျန်",
      value: `${toMyanmarDigits(stats.availablePhones)} လုံး`,
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
      description: "အရောင်းခန်းနှင့် စတိုတွင်ရှိသော ဖုန်းများ",
      tab: "stock",
    },
    {
      title: "ရောင်းပြီးသော ဖုန်းများ",
      value: `${toMyanmarDigits(stats.soldPhones)} လုံး`,
      icon: ShoppingBag,
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
      description: "အောင်မြင်စွာ ရောင်းချပြီးစီးမှုများ",
      tab: "sold",
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
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400",
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
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">အရောင်းဆိုင်၏ အရောင်းလှုပ်ရှားမှုနှင့် ဖုန်းလက်ကျန်များ အချိန်နှင့်တပြေးညီ ခြုံငုံသုံးသပ်ချက်။</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        IMEI: {sale.imei}
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
