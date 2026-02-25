using API_NFSe.API.Authorization;
using API_NFSe.API.Middlewares;
using API_NFSe.API.Services;
using API_NFSe.Application;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using API_NFSe.Application.Services;
using API_NFSe.Infra.Data;
using API_NFSe.Infra.Data.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using Redoc.AspNetCore;
using System.Text;
using System.Text.Json.Serialization;

namespace API_NFSe.API;

public static class Program
{
    private const string AllowAllCorsPolicyName = "AllowAll";

    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        ConfigureLogging(builder);
        ConfigureServices(builder);

        var enableSwagger = ShouldEnableSwagger(builder.Environment, builder.Configuration);

        var (shouldSeed, seedSource) = DeterminarExecucaoSeed(args, builder.Configuration);

        var app = builder.Build();

        var startupLogger = app.Logger;
        startupLogger.LogInformation("Seed on startup flag: {ShouldSeed} (source: {SeedSource})", shouldSeed, seedSource);

        if (shouldSeed)
        {
            startupLogger.LogInformation("Aplicando migrações com seed.");
            await AplicarMigracoesAsync(app, executarSeed: true);
        }
        else
        {
            startupLogger.LogInformation("Aplicando migrações sem seed.");
            await AplicarMigracoesAsync(app, executarSeed: false);
        }

        ConfigurePipeline(app, enableSwagger);

        app.Run();
    }

    private static void ConfigureLogging(WebApplicationBuilder builder)
    {
        builder.Logging.ClearProviders();
        builder.Logging.AddConsole();
    }

    private static void ConfigureServices(WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

        builder.Services.AddDbContext<ApiContext>(options =>
            options.UseMySql(connectionString, serverVersion, mySqlOptions =>
            {
                mySqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));

        builder.Services.AddApplicationModule(builder.Configuration);
        builder.Services.AddInfraDataModule(builder.Configuration);
        builder.Services.AddScoped<DatabaseSeeder>();
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
        builder.Services.AddSingleton<IAuthorizationHandler, ScopeAuthorizationHandler>();
        builder.Services.AddScoped<ICryptoService, CryptoService>();

        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
                         ?? throw new InvalidOperationException("Configurações JWT não foram definidas corretamente.");

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
            };
        });

        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy(RoleNames.Administrador, policy => policy.RequireRole(RoleNames.Administrador));
            options.AddPolicy(RoleNames.Gestao, policy => policy.RequireRole(RoleNames.Gestao));
            options.AddPolicy(RoleNames.Operacao, policy => policy.RequireRole(RoleNames.Operacao));

            options.AddRobotScopePolicy("Scopes.Dps.Leitura", "dps.read");
            options.AddRobotScopePolicy("Scopes.Dps.Criacao", "dps.write");
            options.AddRobotScopePolicy(
                "Scopes.Nfse.Certificados",
                new[] { "nfse.certificados" },
                new[] { RoleNames.Administrador });
            options.AddRobotScopePolicy("Scopes.Nfse.Emitir", "nfse.emitir");
            options.AddRobotScopePolicy("Scopes.Nfse.Cancelar", "nfse.cancelar");
            options.AddRobotScopePolicy("Scopes.Nfse.Danfse", "nfse.danfse");
            options.AddRobotScopePolicy("Scopes.Nfse.Email", "nfse.email");
            options.AddRobotScopePolicy("Scopes.Nfse.Robot", "nfse.robot");
        });

        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

        ConfigurarSwagger(builder);

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(AllowAllCorsPolicyName, policyBuilder =>
            {
                policyBuilder
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });
    }

    private static void ConfigurarSwagger(WebApplicationBuilder builder)
    {
        var swaggerConfig = builder.Configuration.GetSection("Swagger");
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = swaggerConfig["Title"] ?? "API NFSe",
                Version = swaggerConfig["Version"] ?? "v1",
                Description = swaggerConfig["Description"] ?? "API para gerenciamento de Notas Fiscais de Serviço Eletrônicas (NFSe)",
                Contact = new OpenApiContact
                {
                    Name = swaggerConfig["Contact:Name"] ?? "Suporte",
                    Email = swaggerConfig["Contact:Email"] ?? "suporte@empresa.com"
                },
                License = new OpenApiLicense
                {
                    Name = swaggerConfig["License:Name"] ?? "Copyright"
                }
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Informe o token JWT usando o esquema Bearer. Exemplo: 'Bearer {seu token}'"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            var xmlFile = "API_NFSe.API.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath);
            }
        });
    }

    private static void ConfigurePipeline(WebApplication app, bool enableSwagger)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        if (enableSwagger)
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "API NFSe v1");
                c.RoutePrefix = string.Empty;
            });
        }

        app.UseReDoc(options =>
        {
            options.SpecUrl = "/swagger/v1/swagger.json";
            options.RoutePrefix = "docs/manual";
            options.DocumentTitle = "Manual interativo - API NFSe";
        });

        app.UseRouting();
        app.UseCors(AllowAllCorsPolicyName);
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseMiddleware<AuditLoggingMiddleware>();

        app.MapGet("/", () => Results.Ok("API NFSe - Running"));
        app.MapGet("/health", () => Results.Ok("Healthy"));

        app.MapControllers();
    }

    private static bool ShouldEnableSwagger(IHostEnvironment environment, IConfiguration configuration)
    {
        if (environment.IsDevelopment())
        {
            return true;
        }

        return configuration.GetValue("Swagger:EnableInProduction", false);
    }

    private static (bool ShouldSeed, string SeedSource) DeterminarExecucaoSeed(string[] args, IConfiguration configuration)
    {
        if (args.Any(arg => string.Equals(arg, "--seed", StringComparison.OrdinalIgnoreCase)))
        {
            return (true, "command-line argument --seed");
        }

        var resolved = ResolverFonteSeed(configuration);
        if (resolved.ShouldSeed.HasValue)
        {
            return (resolved.ShouldSeed.Value, $"{resolved.Source}='{resolved.RawValue}'");
        }

        return (false, "nenhuma fonte de configuração");
    }

    private static (bool? ShouldSeed, string Source, string? RawValue) ResolverFonteSeed(IConfiguration configuration)
    {
        var candidates = new (string Source, string? Value)[]
        {
            ("Environment:ASPNETCORE_SEED_ON_STARTUP", Environment.GetEnvironmentVariable("ASPNETCORE_SEED_ON_STARTUP")),
            ("Environment:SEED_ON_STARTUP", Environment.GetEnvironmentVariable("SEED_ON_STARTUP")),
            ("Configuration:ASPNETCORE_SEED_ON_STARTUP", configuration["ASPNETCORE_SEED_ON_STARTUP"]),
            ("Configuration:SEED_ON_STARTUP", configuration["SEED_ON_STARTUP"]),
            ("Configuration:Seed:OnStartup", configuration["Seed:OnStartup"]),
            ("Configuration:Seed:Enabled", configuration["Seed:Enabled"]),
        };

        foreach (var (source, value) in candidates)
        {
            if (TryParseBoolean(value, out var parsed))
            {
                return (parsed, source, value);
            }
        }

        return (null, string.Empty, null);
    }

    private static bool TryParseBoolean(string? value, out bool result)
    {
        result = false;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var sanitizedValue = value.Trim();

        if (bool.TryParse(sanitizedValue, out result))
        {
            return true;
        }

        if (string.Equals(sanitizedValue, "1", StringComparison.OrdinalIgnoreCase))
        {
            result = true;
            return true;
        }

        if (string.Equals(sanitizedValue, "0", StringComparison.OrdinalIgnoreCase))
        {
            result = false;
            return true;
        }

        return false;
    }

    private static async Task AplicarMigracoesAsync(WebApplication app, bool executarSeed)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;

        var loggerFactory = services.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("Program");

        try
        {
            logger.LogInformation("Aplicando migrações do banco de dados. executarSeed={ExecutarSeed}", executarSeed);
            var context = services.GetRequiredService<ApiContext>();
            await context.Database.MigrateAsync();

            if (executarSeed)
            {
                var seeder = services.GetRequiredService<DatabaseSeeder>();
                await seeder.SeedAsync();
                logger.LogInformation("Seed executado com sucesso.");
            }
            else
            {
                logger.LogInformation("Seed não executado (executarSeed=false).");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ocorreu um erro ao migrar o banco de dados ou executar o seed.");
        }
    }
}
