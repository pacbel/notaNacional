"use client";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SidebarWrapper() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Se não estiver carregando e não estiver autenticado, redireciona para o login
    if (!loading && !isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Esconde o menu se a rota for exatamente /nfse/show ou começar com /nfse/show/
  // Ou se estiver na página de login
  if (
    pathname === "/nfse/show" || 
    pathname.startsWith("/nfse/show/") || 
    pathname === "/login" || 
    !isAuthenticated
  ) {
    return null;
  }
  
  return <Sidebar />;
}
