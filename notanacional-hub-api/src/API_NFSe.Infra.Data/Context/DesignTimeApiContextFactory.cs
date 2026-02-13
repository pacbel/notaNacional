using System;
using System.IO;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace API_NFSe.Infra.Data.Context;

public sealed class DesignTimeApiContextFactory : IDesignTimeDbContextFactory<ApiContext>
{
    public ApiContext CreateDbContext(string[] args)
    {
        var projectRoot = Directory.GetCurrentDirectory();
        var apiProjectPath = Path.GetFullPath(Path.Combine(projectRoot, "..", "API_NFSe.API"));
        var appSettingsPath = Path.Combine(apiProjectPath, "appsettings.json");

        if (!File.Exists(appSettingsPath))
        {
            throw new FileNotFoundException("Arquivo appsettings.json não encontrado para configuração do DbContext.", appSettingsPath);
        }

        using var jsonStream = File.OpenRead(appSettingsPath);
        using var document = JsonDocument.Parse(jsonStream);
        if (!document.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings) ||
            !connectionStrings.TryGetProperty("DefaultConnection", out var defaultConnection) ||
            string.IsNullOrWhiteSpace(defaultConnection.GetString()))
        {
            throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada em appsettings.json.");
        }

        var connectionString = defaultConnection.GetString()!;

        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

        var optionsBuilder = new DbContextOptionsBuilder<ApiContext>();
        optionsBuilder.UseMySql(
            connectionString,
            serverVersion,
            b => b.MigrationsAssembly("API_NFSe.Infra.Data"));

        return new ApiContext(optionsBuilder.Options);
    }
}
