import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-[hsl(var(--card))] disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))]",
  secondary:
    "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:brightness-110 disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))]",
  outline:
    "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:bg-[hsl(var(--card))] disabled:text-[hsl(var(--muted-foreground))]",
  ghost:
    "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))]",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-[hsl(var(--primary-foreground))] dark:hover:bg-red-600 disabled:bg-red-400",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={twMerge(baseClasses, variants[variant], sizes[size], clsx(className))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
