/**
 * Controle de permissões por role
 * 
 * Roles disponíveis:
 * - Gestao: acesso total
 * - Operacao: acesso limitado (sem Usuários e Configurações)
 */

export type UserRole = "Gestao" | "Operacao";

export function isGestao(role: string): boolean {
  return role === "Gestao" || role === "Gestão";
}

export function isOperacao(role: string): boolean {
  return role === "Operacao" || role === "Operação" || role === "Operacao";
}

export function canAccessUsuarios(role: string): boolean {
  return isGestao(role);
}

export function canAccessConfiguracoes(role: string): boolean {
  return isGestao(role);
}

export function canAccessPrestadores(role: string): boolean {
  return isGestao(role);
}
