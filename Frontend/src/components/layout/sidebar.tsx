"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { navigationItems, type NavigationItem } from "@/constants/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

function isItemVisible(item: NavigationItem, userRoles: string[]) {
  if (!item.roles || item.roles.length === 0) {
    return true;
  }

  return item.roles.some((role) => userRoles.includes(role));
}

function matchActive(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { roles } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const visibleNavigation = useMemo(
    () =>
      navigationItems
        .filter((item) => isItemVisible(item, roles))
        .map((item) =>
          item.children
            ? {
                ...item,
                children: item.children.filter((child) =>
                  isItemVisible(child, roles)
                ),
              }
            : item
        ),
    [roles]
  );

  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] transition-all duration-300",
        collapsed ? "w-[76px]" : "w-64",
        mobileOpen
          ? "fixed inset-y-0 left-0 z-40 w-64 shadow-lg md:relative"
          : "md:relative"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <button
          type="button"
          className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--foreground))]"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            NF
          </span>
          {!collapsed && <span>NFSe Hub</span>}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen((open) => !open)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        <ul className="flex flex-col gap-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = matchActive(pathname, item.href, item.exact);

            if (item.children && item.children.length > 0) {
              const anyChildActive = item.children.some((child) =>
                matchActive(pathname, child.href, child.exact)
              );
              const isOpen = openGroups[item.href] ?? anyChildActive;
              const groupOpen = collapsed ? false : isOpen;
              const parentClasses = clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-all",
                (anyChildActive || groupOpen) && "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              );

              return (
                <li key={item.href} className="flex flex-col">
                  <button
                    type="button"
                    className={parentClasses}
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [item.href]: !(prev[item.href] ?? anyChildActive),
                      }))
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={clsx(
                            "h-4 w-4 transition-transform",
                            groupOpen ? "rotate-180" : "-rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>
                  {groupOpen && (
                    <ul className="mt-1 flex flex-col gap-1 pl-6">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = matchActive(
                          pathname,
                          child.href,
                          child.exact
                        );

                        const childClasses = clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          childActive
                            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow"
                            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                        );
                        const childIconClasses = clsx(
                          "h-4 w-4 flex-shrink-0",
                          childActive
                            ? "text-[hsl(var(--primary-foreground))]"
                            : "text-[hsl(var(--muted-foreground))]"
                        );
                        const childLabelClasses = clsx(
                          "truncate",
                          childActive
                            ? "text-[hsl(var(--primary-foreground))]"
                            : "text-[hsl(var(--muted-foreground))]"
                        );

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={childClasses}
                              onClick={() => setMobileOpen(false)}
                            >
                              <ChildIcon className={childIconClasses} />
                              {!collapsed && <span className={childLabelClasses}>{child.label}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const itemClasses = clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            );
            const iconClasses = clsx(
              "h-4 w-4 flex-shrink-0",
              active
                ? "text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))]"
            );
            const labelClasses = clsx(
              "truncate",
              active
                ? "text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))]"
            );

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={itemClasses}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className={iconClasses} />
                  {!collapsed && <span className={labelClasses}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </aside>
  );
}
