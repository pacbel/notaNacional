"use client";

import { ReactNode, useState, useMemo, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LayoutDashboard, FileText, Users, Settings, LogOut, ChevronLeft, ChevronRight, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { canAccessUsuarios, canAccessConfiguracoes } from "@/lib/permissions";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { getSaldoBilhetagem } from "@/services/bilhetagem";

interface AppShellProps {
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
    prestadorId: string;
  };
  children: ReactNode;
}

export function useSaldoBilhetagem(prestadorId: string | undefined) {
  return useQuery({
    queryKey: ["bilhetagem", "saldo", prestadorId],
    queryFn: () => {
      if (!prestadorId) {
        throw new Error("Prestador não identificado");
      }

      return getSaldoBilhetagem(prestadorId);
    },
    enabled: Boolean(prestadorId),
    staleTime: 5 * 60 * 1000,
  });
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Notas Fiscais", href: "/nfse", icon: FileText },
  { name: "Prestadores", href: "/prestadores", icon: Users },
  { name: "Tomadores", href: "/tomadores", icon: Users },
  { name: "Serviços", href: "/servicos", icon: FileText },
  { name: "Usuários", href: "/usuarios", icon: Users },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function AppShell({ user, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sheetContentId = useId();

  const saldoQuery = useSaldoBilhetagem(user.prestadorId);

  const saldoNotasLabel = useMemo(() => {
    if (saldoQuery.isLoading) {
      return "Carregando...";
    }

    if (saldoQuery.isError) {
      return "Indisponível";
    }

    const saldo = saldoQuery.data?.saldoNotasDisponiveis ?? 0;
    return new Intl.NumberFormat("pt-BR").format(saldo);
  }, [saldoQuery.isError, saldoQuery.isLoading, saldoQuery.data?.saldoNotasDisponiveis]);

  // Filtrar navegação baseado nas permissões do usuário
  const filteredNavigation = useMemo(() => {
    return navigation.filter((item) => {
      if (item.href === "/usuarios") {
        return canAccessUsuarios(user.role);
      }
      if (item.href === "/configuracoes") {
        return canAccessConfiguracoes(user.role);
      }
      return true; // Outros itens são acessíveis para todos
    });
  }, [user.role]);

  async function handleLogout() {
    await fetchWithAuth("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/");
    router.refresh();
  }

  const initials = user.nome
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (collapsed: boolean) => (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col bg-background">
        {/* Header com Ícone e Nome */}
        <div className={cn(
          "flex h-16 items-center border-b bg-[#1351b4] ",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {collapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1351b4]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1351b4]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-white">
                <p className="text-sm font-semibold">Nota Fiscal Nacional</p>
                <p className="text-xs text-white">Gestão NFSe {process.env.NEXT_PUBLIC_APPLICATION_VERSION}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const button = (
              <Button
                variant="ghost"
                className={cn(
                  "w-full",
                  collapsed ? "justify-center px-2" : "justify-start gap-3",
                  isActive && "bg-muted text-primary"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{button}</div>;
          })}
        </nav>

        {/* Botão Sair */}
        <div className="border-t p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="flex min-h-screen">
        {/* Sidebar Desktop */}
        <aside className={cn(
          "hidden border-r bg-background lg:block transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {sidebarContent(isCollapsed)}
          
          {/* Botão Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </aside>

        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden m-2"
              aria-controls={sheetContentId}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            id={sheetContentId}
            side="left"
            className="w-64 p-0 shadow-lg lg:hidden"
          >
            {sidebarContent(false)}
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-[#1351b4] px-4 text-white">
            <div className="hidden lg:flex lg:items-center lg:gap-3 text-white">
              <Separator orientation="vertical" className="h-6" />
              <p className="text-sm text-white">
                Portal operacional de emissão de NFSe
              </p>
            </div>

            <div className="flex items-center gap-4 text-white">
              <div className="hidden text-sm text-white sm:flex">
                <span className="font-medium text-white">Saldo Notas:&nbsp;</span>
                <span>{saldoNotasLabel}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2 bg-[#1351b4] hover:bg-[#1351b4] cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-black text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm text-left lg:flex lg:flex-col text-white">
                      <span className="font-medium">{user.nome}</span>
                      <span className="text-xs text-white">{user.email}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 cursor-pointer bg-white hover:bg-[#fafafa]">
                  <DropdownMenuLabel>{user.nome}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 cursor-pointer"
                    onClick={() => {
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
