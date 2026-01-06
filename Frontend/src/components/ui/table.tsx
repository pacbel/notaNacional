import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";
import { twMerge } from "tailwind-merge";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={twMerge(
          "w-full min-w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-200",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={twMerge("bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={twMerge("divide-y divide-slate-100 dark:divide-slate-800", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={twMerge("hover:bg-slate-50 dark:hover:bg-slate-800", className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={twMerge("px-4 py-3 font-medium text-slate-500 dark:text-slate-300", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={twMerge("px-4 py-3", className)} {...props} />;
}
