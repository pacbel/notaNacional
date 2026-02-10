using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class UpsertPrestadorConfiguracaoDto
    {
        [StringLength(50)]
        public string? VersaoAplicacao { get; set; }

        public bool? EnviaEmailAutomatico { get; set; }

        [StringLength(255)]
        public string? SmtpHost { get; set; }

        [Range(1, 65535)]
        public int? SmtpPort { get; set; }

        public bool? SmtpSecure { get; set; }

        [StringLength(150)]
        public string? SmtpUser { get; set; }

        [StringLength(256)]
        public string? SmtpPassword { get; set; }

        [EmailAddress]
        [StringLength(150)]
        public string? SmtpFrom { get; set; }

        [StringLength(150)]
        public string? SmtpFromName { get; set; }

        [Url]
        [StringLength(255)]
        public string? SmtpResetPasswordUrl { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "O crédito mensal deve ser maior ou igual a zero.")]
        public int? CreditoMensalPadrao { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "O saldo disponível deve ser maior ou igual a zero.")]
        public int? SaldoNotasDisponiveis { get; set; }
    }
}
