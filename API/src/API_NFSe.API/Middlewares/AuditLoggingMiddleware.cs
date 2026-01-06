using System;
using System.IO;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Logs;
using API_NFSe.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace API_NFSe.API.Middlewares
{
    public class AuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLoggingMiddleware> _logger;

        private const int MaxPayloadLength = 4000;

        public AuditLoggingMiddleware(
            RequestDelegate next,
            ILogger<AuditLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestTime = DateTimeOffset.UtcNow;
            string payload = string.Empty;

            if (context.Request.ContentLength > 0 &&
                context.Request.ContentLength <= MaxPayloadLength &&
                context.Request.Body.CanSeek == false)
            {
                context.Request.EnableBuffering();
            }

            if (context.Request.Body.CanSeek)
            {
                try
                {
                    context.Request.Body.Position = 0;
                    using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
                    var body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                    if (!string.IsNullOrWhiteSpace(body))
                    {
                        payload = body.Length > MaxPayloadLength ? body[..MaxPayloadLength] : body;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Falha ao ler payload da requisição para auditoria.");
                }
            }

            await _next(context);

            try
            {
                var currentUserService = context.RequestServices.GetService<ICurrentUserService>();
                var auditLogger = context.RequestServices.GetService<IAuditLogger>();
                if (auditLogger is null)
                {
                    _logger.LogWarning("IAuditLogger não está registrado. Ignorando auditoria para {Path}", context.Request.Path);
                    return;
                }

                var userId = GetUsuarioIdSafe(currentUserService);
                var usuarioNome = GetClaimValue(context.User, ClaimTypes.Name) ?? string.Empty;
                var email = GetClaimValue(context.User, ClaimTypes.Email) ?? string.Empty;
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
                var rota = context.Request.Path.HasValue ? context.Request.Path.Value! : string.Empty;
                var metodo = context.Request.Method;
                var acao = context.GetEndpoint()?.DisplayName ?? rota;
                var statusCode = context.Response?.StatusCode ?? 0;

                var entry = new AuditLogEntryDto
                {
                    UsuarioId = userId,
                    UsuarioNome = string.IsNullOrWhiteSpace(usuarioNome) ? "" : usuarioNome,
                    Email = string.IsNullOrWhiteSpace(email) ? "" : email,
                    Metodo = metodo,
                    Rota = rota,
                    Acao = acao ?? string.Empty,
                    StatusCode = statusCode,
                    Ip = ip,
                    Payload = payload,
                    DataHora = requestTime
                };

                await auditLogger.RegistrarAsync(entry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar auditoria.");
            }
        }

        private Guid? GetUsuarioIdSafe(ICurrentUserService? currentUserService)
        {
            try
            {
                if (currentUserService?.UsuarioAutenticado == true)
                {
                    return currentUserService.ObterUsuarioId();
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Não foi possível determinar o usuário autenticado para auditoria.");
            }

            return null;
        }

        private static string? GetClaimValue(ClaimsPrincipal user, string claimType)
        {
            return user?.FindFirst(claimType)?.Value;
        }
    }
}
