"use client";

import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface GlobalLoadingOverlayProps {
  visible: boolean;
  className?: string;
}

export function GlobalLoadingOverlay({ visible, className }: GlobalLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg shadow-slate-900/10">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700">Carregando...</span>
      </div>
    </div>
  );
}
