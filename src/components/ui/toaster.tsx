"use client";

import { Toaster } from "sonner";
import React from "react";

/**
 * Global Toaster component. Place once near the root of the app (e.g. in `layout.tsx`).
 * Tailwind classes rely on Sonner's data attributes for theming.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton
      richColors
      expand
      gap={10}
      visibleToasts={6}
      toastOptions={{
        className:
          "group rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-[0_4px_16px_-2px_rgba(0,0,0,0.12)] border border-gray-200/60 dark:border-zinc-800/60 px-4 py-3 data-[type=error]:border-red-500/50 data-[type=success]:border-emerald-500/50 data-[type=warning]:border-amber-500/50",
        style: { fontSize: "0.85rem", lineHeight: 1.25 },
        duration: 4200,
      }}
      icons={{
        success: (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
            ✓
          </span>
        ),
        error: (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
            !
          </span>
        ),
        loading: (
          <span className="inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white" />
        ),
        warning: (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
            !
          </span>
        ),
      }}
    />
  );
}
