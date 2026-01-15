"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LayoutDashboard, FileText, Users, Settings, LogOut } from "lucide-react";

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
import { cn } from "@/lib/utils";

interface AppShellProps {
  user: {
    id: string;
    nome: string;
    email: string;
  };
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Notas Fiscais", href: "/nfse", icon: FileText },
  { name: "Prestadores", href: "/prestadores", icon: Users },
  { name: "Tomadores", href: "/tomadores", icon: Users },
  { name: "Serviços", href: "/servicos", icon: FileText },
  { name: "Configurações", href: "/configuracoes/nfse", icon: Settings },
];

export default function AppShell({ user, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
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

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div>
          <p className="text-sm font-semibold">NotaClient</p>
          <p className="text-xs text-muted-foreground">Gestão NFSe</p>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("rounded-md", isActive && "bg-muted")}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-4">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r bg-background lg:block">{sidebarContent}</aside>

        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 shadow-lg lg:hidden">
            {sidebarContent}
          </SheetContent>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden m-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </Sheet>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <p className="text-lg font-semibold">NotaClient</p>
              <Separator orientation="vertical" className="h-6" />
              <p className="text-sm text-muted-foreground">
                Portal operacional de emissão de NFSe
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm text-left lg:flex lg:flex-col">
                    <span className="font-medium">{user.nome}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.nome}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes/nfse">Configurações</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
