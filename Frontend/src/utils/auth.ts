import { jwtDecode } from "jwt-decode";
import { AuthTokens, AuthenticatedUser, DecodedUserToken, RoleName } from "@/types/auth";

const ROLE_ORDER: RoleName[] = ["Administrador", "Gestao", "Operacao", "Robot"];

const ROLE_ALIASES: Record<string, RoleName> = {
  administrador: "Administrador",
  admin: "Administrador",
  gestor: "Gestao",
  gestao: "Gestao",
  gestora: "Gestao",
  gestorio: "Gestao",
  gestaooperacional: "Gestao",
  operacao: "Operacao",
  operacaoal: "Operacao",
  operacional: "Operacao",
  operador: "Operacao",
  robot: "Robot",
  robo: "Robot",
  robos: "Robot",
};

const ROLE_KEY_PATTERN = /(?:^|[/:])roles?$/i;

function collectRoleClaims(decoded: DecodedUserToken): unknown[] {
  const claims: unknown[] = [];
  const seenKeys = new Set<string>();

  const registerClaim = (key: string, value: unknown) => {
    if (value === undefined || value === null) {
      return;
    }
    if (seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);
    claims.push(value);
  };

  registerClaim("roles", decoded.roles);
  registerClaim("role", decoded.role);

  for (const [key, value] of Object.entries(decoded)) {
    if (ROLE_KEY_PATTERN.test(key)) {
      registerClaim(key, value);
    }
  }

  return claims;
}

function resolveRoleName(value: unknown): RoleName | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedKey = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

  return ROLE_ALIASES[normalizedKey] ?? null;
}

export function extractUserFromToken(accessToken: string): AuthenticatedUser | null {
  if (!accessToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedUserToken>(accessToken);
    const roles: RoleName[] = [];

    const uniqueRoles = new Set<RoleName>();
    const roleClaims = collectRoleClaims(decoded);

    for (const claim of roleClaims) {
      if (Array.isArray(claim)) {
        for (const role of claim) {
          const resolved = resolveRoleName(role);
          if (resolved) {
            uniqueRoles.add(resolved);
          }
        }
      } else {
        const resolved = resolveRoleName(claim);
        if (resolved) {
          uniqueRoles.add(resolved);
        }
      }
    }

    if (uniqueRoles.size === 0) {
      uniqueRoles.add("Robot");
    }

    for (const role of ROLE_ORDER) {
      if (uniqueRoles.has(role)) {
        roles.push(role);
      }
    }

    const id = decoded.sub ?? decoded["nameid"];

    if (!id || typeof id !== "string") {
      return null;
    }

    const decodedName =
      typeof decoded.name === "string" && decoded.name.trim().length > 0
        ? decoded.name.trim()
        : typeof decoded["nome"] === "string" && String(decoded["nome"]).trim().length > 0
          ? String(decoded["nome"]).trim()
          : undefined;

    return {
      id,
      nome: decodedName,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
      roles,
      prestadorId:
        typeof decoded.prestadorId === "string" && decoded.prestadorId.length > 0
          ? decoded.prestadorId
          : null,
    };
  } catch (error) {
    console.error("Falha ao decodificar token JWT", error);
    return null;
  }
}

export function parseExpiration(tokens: AuthTokens): number | null {
  if (!tokens.expiraEm) {
    return null;
  }

  const expiration = new Date(tokens.expiraEm).getTime();
  if (Number.isNaN(expiration)) {
    return null;
  }

  return expiration;
}
