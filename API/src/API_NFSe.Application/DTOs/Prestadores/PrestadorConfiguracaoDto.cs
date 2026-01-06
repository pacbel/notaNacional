using System;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class PrestadorConfiguracaoDto
    {
        public Guid Id { get; set; }
        public int Ambiente { get; set; }
        public string VersaoAplicacao { get; set; } = string.Empty;
        public string SeriePadrao { get; set; } = string.Empty;
        public long NumeroAtual { get; set; }
        public string? UrlEnvio { get; set; }
        public string? UrlConsulta { get; set; }
        public bool EnviaEmailAutomatico { get; set; }
        public Guid AtualizadoPorUsuarioId { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public bool SmtpSecure { get; set; }
        public string? SmtpUser { get; set; }
        public string? SmtpFrom { get; set; }
        public string? SmtpFromName { get; set; }
        public string? SmtpResetPasswordUrl { get; set; }
        public string? CertificadoPadraoId { get; set; }
        public bool HasSmtpPassword { get; set; }
    }
}
