FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY ["API_NFSe.sln", "./"]
COPY ["src/API_NFSe.API/API_NFSe.API.csproj", "src/API_NFSe.API/"]
COPY ["src/API_NFSe.Application/API_NFSe.Application.csproj", "src/API_NFSe.Application/"]
COPY ["src/API_NFSe.Domain/API_NFSe.Domain.csproj", "src/API_NFSe.Domain/"]
COPY ["src/API_NFSe.Infra.Data/API_NFSe.Infra.Data.csproj", "src/API_NFSe.Infra.Data/"]
COPY ["tests/API_NFSe.Tests/API_NFSe.Tests.csproj", "tests/API_NFSe.Tests/"]

RUN dotnet restore "API_NFSe.sln"

COPY . .

RUN dotnet publish "src/API_NFSe.API/API_NFSe.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

ENTRYPOINT ["dotnet", "API_NFSe.API.dll"]
