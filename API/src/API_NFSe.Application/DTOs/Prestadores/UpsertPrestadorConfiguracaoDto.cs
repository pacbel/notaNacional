using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class UpsertPrestadorConfiguracaoDto
    {
        [Required]
        [Range(1, 2)]
        public int Ambiente { get; set; }

        [StringLength(50)]
        public string? VersaoAplicacao { get; set; }

        [StringLength(5)]
        public string? SeriePadrao { get; set; }

        [Range(1, long.MaxValue)]
        public long? NumeroAtual { get; set; }

        [Url]
        public string? UrlEnvio { get; set; }

        [Url]
        public string? UrlConsulta { get; set; }

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
    }
}
