# Executando a API NFSe com Docker

Este guia explica como configurar e executar a aplicação API NFSe usando Docker e Docker Compose.

## Pré-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose (geralmente incluído com o Docker Desktop)

## Configuração

1. **Crie um arquivo `.env` na raiz do projeto** (ou configure as variáveis no EasyPanel) com as seguintes variáveis de ambiente:

   ```env
   # Configurações do Banco de Dados (MySQL externo)
   DB_SERVER=seu-host-mysql
   DB_PORT=3306
   DB_DATABASE=NFSeDB
   DB_USER=nfse_user
   DB_PASSWORD=sua_senha_segura

   # Configurações da API
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://+:8080

   # Configurações de Log
   LOG_LEVEL=Information

   # Connection string completa (opcional; se não informado será montada a partir das variáveis acima)
   ConnectionStrings__DefaultConnection=Server=seu-host-mysql;Port=3306;Database=NFSeDB;Uid=nfse_user;Pwd=sua_senha_segura;
   ```

2. **Um `Dockerfile` multi-stage já está disponível na raiz** e possui o seguinte conteúdo (resumido):

   ```dockerfile
   FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
   WORKDIR /src

   COPY ["API_NFSe.sln", "./"]
   COPY ["src/API_NFSe.API/API_NFSe.API.csproj", "src/API_NFSe.API/"]
   COPY ["src/API_NFSe.Application/API_NFSe.Application.csproj", "src/API_NFSe.Application/"]
   COPY ["src/API_NFSe.Domain/API_NFSe.Domain.csproj", "src/API_NFSe.Domain/"]
   COPY ["src/API_NFSe.Infra.Data/API_NFSe.Infra.Data.csproj", "src/API_NFSe.Infra.Data/"]

   RUN dotnet restore "API_NFSe.sln"

   COPY . .

   RUN dotnet publish "src/API_NFSe.API/API_NFSe.API.csproj" \\
       -c Release \\
       -o /app/publish \\
       /p:UseAppHost=false

   FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
   WORKDIR /app
   ENV ASPNETCORE_URLS=http://+:8080
   COPY --from=build /app/publish .
   EXPOSE 8080
   ENTRYPOINT ["dotnet", "API_NFSe.API.dll"]
   ```

3. **O `docker-compose.yml` oficial expõe apenas o serviço da API** consumindo um banco MySQL externo:

   ```yaml
   version: '3.8'

   services:
     api:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: nfse-api
       restart: unless-stopped
       ports:
         - "8080:8080"
       environment:
         - ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Production}
         - ASPNETCORE_URLS=${ASPNETCORE_URLS:-http://+:8080}
         - ConnectionStrings__DefaultConnection=${ConnectionStrings__DefaultConnection:-Server=${DB_SERVER:-localhost};Port=${DB_PORT:-3306};Database=${DB_DATABASE:-NFSeDB};Uid=${DB_USER:-nfse_user};Pwd=${DB_PASSWORD:-nfse_pass};}
         - Logging__LogLevel__Default=${LOG_LEVEL:-Information}
       networks:
         - nfse-network

   networks:
     nfse-network:
       driver: bridge
   ```

## Executando a aplicação

1. **Certifique-se de que o MySQL externo esteja acessível** a partir da VPS/host onde o container será executado. Ajuste firewall e credenciais conforme necessário.

2. **Construa e inicie o container da API** com o comando:

   ```bash
   docker-compose up -d --build
   ```

3. **Acompanhe os logs** da aplicação com:

   ```bash
   docker-compose logs -f api
   ```

4. **Acesse a aplicação** em:
   - API (Swagger): http://localhost:8080/swagger

5. **Pare o container** quando não estiver mais em uso:

   ```bash
   docker-compose down
   ```

## Executando migrações

As migrações do Entity Framework serão executadas automaticamente quando a aplicação iniciar. Se precisar executá-las manualmente, use:

```bash
docker-compose exec api dotnet ef database update --project src/API_NFSe.Infra.Data
```

## Solução de problemas

- **Erro de conexão com o banco de dados**: Verifique se o container do MySQL está em execução e se as credenciais estão corretas.
- **Problemas de migração**: Execute `docker-compose down -v` para remover os volumes e, em seguida, `docker-compose up -d --build` para recriar tudo do zero.
- **Logs de erro**: Use `docker-compose logs` para visualizar os logs dos serviços.

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DB_SERVER` | Endereço do servidor MySQL externo | `localhost` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_DATABASE` | Nome do banco de dados | `NFSeDB` |
| `DB_USER` | Usuário do banco de dados | `nfse_user` |
| `DB_PASSWORD` | Senha do banco de dados | `nfse_pass` |
| `ConnectionStrings__DefaultConnection` | Connection string completa (sobrepõe as variáveis acima) | Montada via `DB_*` |
| `ASPNETCORE_ENVIRONMENT` | Ambiente de execução | `Production` |
| `ASPNETCORE_URLS` | URLs em que a aplicação escuta | `http://+:8080` |
| `LOG_LEVEL` | Nível de log padrão | `Information` |
