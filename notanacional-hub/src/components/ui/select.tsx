import { SelectHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const baseClasses =
  "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:ring-offset-slate-950";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return <select ref={ref} className={twMerge(baseClasses, className)} {...props} />;
  }
);

Select.displayName = "Select";
