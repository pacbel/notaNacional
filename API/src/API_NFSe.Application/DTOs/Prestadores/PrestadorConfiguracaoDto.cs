using System;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class PrestadorConfiguracaoDto
    {
        public Guid Id { get; set; }
        public string VersaoAplicacao { get; set; } = string.Empty;
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
        public int? CreditoMensalPadrao { get; set; }
        public int SaldoNotasDisponiveis { get; set; }
        public DateTime? CompetenciaSaldo { get; set; }
    }
}
