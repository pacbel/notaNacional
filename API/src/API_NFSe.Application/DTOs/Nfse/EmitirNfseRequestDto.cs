using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Nfse
{
    public class EmitirNfseRequestDto
    {
        [Required]
        public string XmlAssinado { get; set; } = string.Empty;

        [Range(1, 2, ErrorMessage = "O ambiente deve ser 1 (produção) ou 2 (homologação).")]
        public int Ambiente { get; set; }

        [Required]
        public string CertificateId { get; set; } = string.Empty;
    }
}
