using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class AuditLog : EntityBase
    {
        public Guid? UsuarioId { get; private set; }
        public string UsuarioNome { get; private set; }
        public string Email { get; private set; }
        public string Metodo { get; private set; }
        public string Rota { get; private set; }
        public string Acao { get; private set; }
        public int StatusCode { get; private set; }
        public string Ip { get; private set; }
        public string? Payload { get; private set; }
        public DateTimeOffset DataHora { get; private set; }

        private AuditLog()
        {
            UsuarioNome = string.Empty;
            Email = string.Empty;
            Metodo = string.Empty;
            Rota = string.Empty;
            Acao = string.Empty;
            Ip = string.Empty;
        }

        public AuditLog(
            Guid? usuarioId,
            string usuarioNome,
            string email,
            string metodo,
            string rota,
            string acao,
            int statusCode,
            string ip,
            string? payload,
            DateTimeOffset dataHora)
        {
            UsuarioId = usuarioId;
            UsuarioNome = usuarioNome?.Trim() ?? string.Empty;
            Email = email?.Trim() ?? string.Empty;
            Metodo = metodo?.Trim() ?? string.Empty;
            Rota = rota?.Trim() ?? string.Empty;
            Acao = acao?.Trim() ?? string.Empty;
            StatusCode = statusCode;
            Ip = ip?.Trim() ?? string.Empty;
            Payload = payload;
            DataHora = dataHora;
        }
    }
}
