import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, Eye, EyeOff, Smartphone, ShieldAlert, Sun, Moon } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function LoginView({ onLoginSuccess, theme, toggleTheme }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Minor delay to simulate secure authentication handshake elegantly
    setTimeout(() => {
      if (username.trim() === "admin" && password === "phyomobilepos2026@") {
        onLoginSuccess();
      } else {
        setError("အသုံးပြုသူအမည် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။");
        setIsSubmitting(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* Top Bar for Theme Toggle */}
      <div className="w-full max-w-7xl mx-auto flex justify-end pt-2 z-10">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm text-slate-600 dark:text-slate-300 cursor-pointer"
          title={theme === "light" ? "Dark Mode သို့ ပြောင်းရန်" : "Light Mode သို့ ပြောင်းရန်"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>

      {/* Central Login Card Container */}
      <div className="flex-1 flex items-center justify-center py-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-xl p-8 sm:p-10"
        >
          {/* Logo & Brand Info */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
              <Smartphone className="h-7 w-7" />
            </div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">
              Phyo Mobile POS
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
              စနစ်အတွင်းသို့ ဝင်ရောက်ရန် ကျေးဇူးပြု၍ လော့ဂ်အင်ဝင်ပါ
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                အသုံးပြုသူအမည် (Username)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                လျှို့ဝှက်နံပါတ် (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 focus:bg-white dark:bg-slate-800/30 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm tracking-wide shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "လော့ဂ်အင်ဝင်နေပါသည်..." : "လော့ဂ်အင်ဝင်မည်"}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 py-4 select-none shrink-0 z-10 uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Phyo Mobile POS - All Rights Reserved.
      </div>
    </div>
  );
}
