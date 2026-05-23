"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

export type ToastVariant =
  | "default"
  | "destructive"
  | "success"
  | "info"
  | "warning";

export interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
  id?: string | number;
  duration?: number;
}

const variantClasses: Record<ToastVariant, string> = {
  default: "",
  destructive: "bg-red-600 text-white",
  success: "bg-emerald-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
};

function mergeClass(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Simple wrapper to mirror the shadcn-style useToast API while delegating
 * to Sonner. This lets existing components call `const { toast } = useToast()`
 * and keeps the dependency surface small if we ever swap libraries.
 */
export interface UseToastReturn {
  toast: (
    input: string | ToastInput,
    override?: ExternalToast,
  ) => string | number;
  success: (message: string, opts?: ExternalToast) => string | number;
  error: (message: string, opts?: ExternalToast) => string | number;
  info: (message: string, opts?: ExternalToast) => string | number;
  warning: (message: string, opts?: ExternalToast) => string | number;
  promise: typeof sonnerToast.promise;
}

export function useToast(): UseToastReturn {
  function baseToast(input: string | ToastInput, override?: ExternalToast) {
    if (typeof input === "string") return sonnerToast(input, override);
    const {
      title,
      description,
      variant = "default",
      action,
      id,
      duration,
    } = input;
    const content = title ?? description ?? "";
    const options: ExternalToast = {
      id,
      duration: duration ?? 3800,
      description: title && description ? description : undefined,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      className: mergeClass(override?.className, variantClasses[variant]),
      ...override,
    };
    return sonnerToast(content, options);
  }

  return {
    toast: baseToast,
    success: (m, o) => sonnerToast.success(m, o),
    error: (m, o) => sonnerToast.error(m, o),
    info: (m, o) => sonnerToast.info(m, o),
    warning: (m, o) => sonnerToast.warning?.(m, o) ?? sonnerToast(m, o),
    promise: sonnerToast.promise.bind(sonnerToast),
  };
}

export type ToastFn = UseToastReturn["toast"];

// Re-export the raw toast in case some places prefer direct import:
export const toast = sonnerToast;
