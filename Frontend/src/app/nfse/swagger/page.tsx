import { appConfig } from "@/lib/config";

export default function NFSeSwaggerPage() {
  const swaggerUrl = `${appConfig.apiBaseUrl}${appConfig.swaggerPath}`;

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Swagger NFSe</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Esta página incorpora a documentação interativa da API utilizando o endpoint Swagger disponível no backend.
        </p>
      </header>
      <div className="flex-1 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm">
        <iframe
          title="Swagger NFSe"
          src={swaggerUrl}
          className="h-[80vh] w-full"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
