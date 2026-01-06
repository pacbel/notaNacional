"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Bell, ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/theme-context";

export function Header() {
  const { user, roles, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.nome) {
      return user?.email?.[0]?.toUpperCase() ?? "?";
    }

    return user.nome
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [user]);

  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const labelOverrides: Record<string, string> = {
      nfse: "NFSe",
      mfa: "MFA",
    };

    const formatSegment = (segment: string) => {
      const lower = segment.toLowerCase();
      if (labelOverrides[lower]) {
        return labelOverrides[lower];
      }

      return segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };

    const items: { label: string; href: string }[] = [];

    if (segments.length === 0 || segments[0] === "dashboard") {
      items.push({ label: "Visão Geral", href: "/dashboard" });
    } else {
      items.push({ label: "Dashboard", href: "/dashboard" });
    }

    let pathAccumulator = "";
    segments.forEach((segment) => {
      if (segment === "dashboard") {
        pathAccumulator = "/dashboard";
        return;
      }

      pathAccumulator += `/${segment}`;
      items.push({ label: formatSegment(segment), href: pathAccumulator });
    });

    return items;
  }, [pathname]);

  const showDashboardGreeting = pathname === "/dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-[hsl(var(--foreground))]">
      <nav aria-label="Breadcrumb" className="flex flex-col gap-1">
        <ol className="flex flex-wrap items-center text-sm text-[hsl(var(--muted-foreground))]">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <li key={item.href} className="flex items-center">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-[hsl(var(--foreground))]"
                  >
                    {item.label}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.href}
                      className="font-medium text-[hsl(var(--foreground))] transition-colors hover:text-sky-500"
                    >
                      {item.label}
                    </Link>
                    <ChevronRight
                      className="mx-2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
                      aria-hidden="true"
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
        {showDashboardGreeting && (
          <p className="text-sm text-[oklch(var(--muted-foreground,63%_0.02_240))]">
            Olá, {user?.nome ?? user?.email}! Aqui está o status atual da operação.
          </p>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Tema escuro" : "Tema claro"}
        >
          {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-sm transition-all hover:border-[hsl(var(--muted))]"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--accent-foreground))]">
              {initials}
            </span>
            <span className="hidden text-left text-sm md:flex md:flex-col">
              <span className="font-medium text-[hsl(var(--foreground))]">
                {user?.nome ?? user?.email}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg">
              <div className="border-b border-[hsl(var(--border))] p-3">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user?.nome ?? user?.email}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {roles.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col p-2">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
