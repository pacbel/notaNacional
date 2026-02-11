"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import clsx from "clsx";

const PUBLIC_ROUTES = new Set(["/login", "/forgot-password", "/reset-password", "/onboarding"]);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  if (PUBLIC_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className={clsx("flex-1 overflow-y-auto p-6")}>{children}</main>
      </div>
    </div>
  );
}
