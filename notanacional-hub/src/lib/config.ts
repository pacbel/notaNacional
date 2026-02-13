const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

if (!rawApiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL não está definido. Configure o valor no arquivo .env.local (ex.: NEXT_PUBLIC_API_BASE_URL=https://localhost:7020)."
  );
}

const rawSwaggerPath = process.env.NEXT_PUBLIC_SWAGGER_PATH?.trim();

export const appConfig = {
  apiBaseUrl: rawApiBaseUrl,
  tokenStorageKey: "nfse.auth.tokens",
  swaggerPath: rawSwaggerPath && rawSwaggerPath.startsWith("/") ? rawSwaggerPath : "/index.html",
};

export function buildApiUrl(path: string) {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${trimmed}`;
}
