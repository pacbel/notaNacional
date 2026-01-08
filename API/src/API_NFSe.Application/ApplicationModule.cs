using System.Reflection;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Services;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace API_NFSe.Application
{
    public static class ApplicationModule
    {
        public static IServiceCollection AddApplicationModule(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            // Configuração do AutoMapper
            services.AddAutoMapper(Assembly.GetExecutingAssembly());

            // Configuração das opções
            services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
            services.Configure<EncryptionSettings>(configuration.GetSection("Encryption"));
            services.Configure<CertificateStorageSettings>(configuration.GetSection("CertificateStorage"));
            services.Configure<AdminUserSettings>(configuration.GetSection("AdminUser"));
            services.Configure<MfaSettings>(configuration.GetSection("Mfa"));

            services.AddSingleton(sp => sp.GetRequiredService<IOptions<JwtSettings>>().Value);
            services.AddSingleton(
                sp => sp.GetRequiredService<IOptions<EncryptionSettings>>().Value
            );
            services.AddSingleton(sp => sp.GetRequiredService<IOptions<AdminUserSettings>>().Value);
            services.AddSingleton(sp => sp.GetRequiredService<IOptions<MfaSettings>>().Value);
            services.AddSingleton(sp => sp.GetRequiredService<IOptions<CertificateStorageSettings>>().Value);

            services.AddSingleton<ICryptographyService, CryptographyService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IUsuarioService, UsuarioService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IPrestadorService, PrestadorService>();
            services.AddScoped<IRobotClientService, RobotClientService>();
            services.AddScoped<IEmailEnvioService, EmailEnvioService>();

            return services;
        }
    }
}
