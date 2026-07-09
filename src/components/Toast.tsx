/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50";
          let Icon = Info;
          let iconColor = "text-zinc-500";

          if (toast.type === "success") {
            bgColor = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-100";
            Icon = CheckCircle2;
            iconColor = "text-emerald-500";
          } else if (toast.type === "error") {
            bgColor = "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-100";
            Icon = AlertCircle;
            iconColor = "text-rose-500";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-grow text-sm font-medium pr-2">
                {toast.message}
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
