import type { RoleName } from "@/types/auth";
import { BarChart3, Building2, LockKeyhole, ServerCog, Users, Workflow } from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: RoleName[];
  children?: NavigationItem[];
  exact?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    label: "Prestadores",
    href: "/prestadores",
    icon: Building2,
    roles: ["Administrador", "Gestao", "Operacao"],
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: Users,
    roles: ["Administrador"],
  },
  {
    label: "Clientes Robóticos",
    href: "/robot-clients",
    icon: ServerCog,
    roles: ["Administrador"],
  },
  {
    label: "Certificados",
    href: "/nfse/certificados",
    icon: LockKeyhole,
    roles: ["Administrador", "Gestao", "Operacao", "Robot"],
  },
  // {
  //   label: "Swagger",
  //   href: "/nfse/swagger",
  //   icon: Workflow,
  //   roles: ["Administrador", "Gestao", "Operacao", "Robot"],
  // },
];
