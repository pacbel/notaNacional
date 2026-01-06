using System;

namespace API_NFSe.Application.DTOs.Logs
{
    public class AuditLogEntryDto
    {
        public Guid? UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
        public string Rota { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string Ip { get; set; } = string.Empty;
        public string? Payload { get; set; }
        public DateTimeOffset DataHora { get; set; }
    }
}
