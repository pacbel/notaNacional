/**
 * Controle de permissões por role
 * 
 * Roles disponíveis:
 * - Administrador: acesso total
 * - Gestao: acesso total
 * - Operacao: acesso limitado (sem Usuários e Configurações)
 */

export type UserRole = "Administrador" | "Gestao" | "Operacao";

function normalizeRole(role?: string | null): string {
  if (!role) {
    return "";
  }

  return role
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function isAdministrador(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "administrador" || normalized === "administrator";
}

export function isGestao(role?: string | null): boolean {
  return normalizeRole(role) === "gestao";
}

export function isOperacao(role?: string | null): boolean {
  return normalizeRole(role) === "operacao";
}

export function hasFullAccess(role?: string | null): boolean {
  return isAdministrador(role) || isGestao(role);
}

export function canAccessUsuarios(role?: string | null): boolean {
  return hasFullAccess(role);
}

export function canAccessConfiguracoes(role?: string | null): boolean {
  return hasFullAccess(role);
}

export function canAccessPrestadores(role?: string | null): boolean {
  return hasFullAccess(role);
}
