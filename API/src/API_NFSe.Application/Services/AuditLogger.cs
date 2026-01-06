using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Logs;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;

namespace API_NFSe.Application.Services
{
    public class AuditLogger : IAuditLogger
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public AuditLogger(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task RegistrarAsync(AuditLogEntryDto entry)
        {
            if (entry == null)
            {
                throw new ArgumentNullException(nameof(entry));
            }

            var auditLog = new AuditLog(
                entry.UsuarioId,
                entry.UsuarioNome,
                entry.Email,
                entry.Metodo,
                entry.Rota,
                entry.Acao,
                entry.StatusCode,
                entry.Ip,
                entry.Payload,
                entry.DataHora == default ? DateTimeOffset.UtcNow : entry.DataHora);

            await _auditLogRepository.RegistrarAsync(auditLog);
        }
    }
}
