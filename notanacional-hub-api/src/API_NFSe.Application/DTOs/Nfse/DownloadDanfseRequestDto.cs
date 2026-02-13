using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Nfse
{
    public sealed class DownloadDanfseRequestDto
    {
        [Required]
        public string ChaveAcesso { get; set; } = string.Empty;

        [Range(1, 2, ErrorMessage = "O ambiente deve ser 1 (produção) ou 2 (homologação).")]
        public int Ambiente { get; set; } = 2;

        public string? CertificateId { get; set; }
    }
}
