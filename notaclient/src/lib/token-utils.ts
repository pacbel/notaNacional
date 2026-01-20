const BASE64_REGEX = /^[A-Za-z0-9\-_]+$/;

function normalizeBase64UrlSegment(segment: string): string {
  if (!BASE64_REGEX.test(segment)) {
    throw new Error("Segmento de token inválido");
  }

  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return normalized + "=".repeat(padding);
}

function decodeBase64UrlToString(segment: string): string {
  const normalized = normalizeBase64UrlSegment(segment);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf-8");
  }

  if (typeof atob === "function") {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  }

  throw new Error("Ambiente sem suporte para decodificação base64");
}

export function decodeTokenPayload(accessToken: string): Record<string, unknown> | null {
  if (!accessToken) {
    return null;
  }

  const parts = accessToken.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJson = decodeBase64UrlToString(parts[1]);
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch (error) {
    console.error("[TokenUtils] Erro ao decodificar payload do token", error);
    return null;
  }
}

export function getPrestadorIdFromToken(accessToken: string): string | null {
  const payload = decodeTokenPayload(accessToken);

  if (!payload) {
    return null;
  }

  const prestadorId =
    payload.prestadorId ||
    payload.PrestadorId ||
    payload.prestador_id ||
    payload.idPrestador ||
    payload.IdPrestador;

  return prestadorId ? String(prestadorId) : null;
}
