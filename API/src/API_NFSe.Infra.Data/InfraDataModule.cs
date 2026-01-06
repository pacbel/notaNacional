using Microsoft.Extensions.DependencyInjection;
using API_NFSe.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using API_NFSe.Infra.Data.Context;
using API_NFSe.Application.Interfaces;
using API_NFSe.Infra.Data.Services.Nfse;
using API_NFSe.Infra.Data.Services.Nfse.Parsing;
using API_NFSe.Application.Services;
using API_NFSe.Infra.Data.Repositories;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace API_NFSe.Infra.Data
{
    public static class InfraDataModule
    {
        public static IServiceCollection AddInfraDataModule(this IServiceCollection services, IConfiguration configuration)
        {
            // Configuração do DbContext
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

            services.AddDbContext<ApiContext>(options =>
            {
                options.UseQueryTrackingBehavior(QueryTrackingBehavior.TrackAll);
                options.UseMySql(
                    connectionString,
                    serverVersion,
                    b => b.MigrationsAssembly("API_NFSe.API")
                );
            });

            services.AddHttpClient();

            // Registro dos repositórios
            services.AddScoped<IDpsRepository, DpsRepository>();
            services.AddScoped<IPrestadorRepository, PrestadorRepository>();
            services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddScoped<IRobotClientRepository, RobotClientRepository>();

            // Serviços NFSe
            services.AddSingleton<ICertificateStoreFactory, DefaultCertificateStoreFactory>();
            services.AddSingleton<ICertificateStoreService, CertificateStoreService>();
            services.AddSingleton<IXmlSignatureService, XmlSignatureService>();
            services.AddSingleton<INfseStorageService, NfseStorageService>();
            services.AddSingleton<INfseResponseParser, NfseResponseParser>();
            services.AddScoped<ISefinHttpClient, SefinHttpClient>();
            services.AddScoped<INfseSefinService, NfseSefinService>();
            services.AddScoped<IAuditLogger, AuditLogger>();

            return services;
        }
    }
}
