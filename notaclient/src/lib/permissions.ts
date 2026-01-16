/**
 * Controle de permissões por role
 * 
 * Roles disponíveis:
 * - Administrador: acesso total
 * - Gestao: acesso total
 * - Operacao: acesso limitado (sem Usuários e Configurações)
 */

export type UserRole = "Administrador" | "Gestao" | "Operacao";

export function isAdministrador(role: string): boolean {
  return role === "Administrador" || role === "Administrator";
}

export function isGestao(role: string): boolean {
  return role === "Gestao" || role === "Gestão";
}

export function isOperacao(role: string): boolean {
  return role === "Operacao" || role === "Operação";
}

export function hasFullAccess(role: string): boolean {
  return isAdministrador(role) || isGestao(role);
}

export function canAccessUsuarios(role: string): boolean {
  return hasFullAccess(role);
}

export function canAccessConfiguracoes(role: string): boolean {
  return hasFullAccess(role);
}

export function canAccessPrestadores(role: string): boolean {
  return hasFullAccess(role);
}
