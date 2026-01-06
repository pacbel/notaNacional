using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class EnderecoDto
    {
        [Required]
        [StringLength(150)]
        public string Logradouro { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Numero { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Complemento { get; set; }

        [Required]
        [StringLength(80)]
        public string Bairro { get; set; } = string.Empty;

        [Required]
        [StringLength(7, MinimumLength = 7)]
        public string CodigoMunicipioIbge { get; set; } = string.Empty;

        [StringLength(2, MinimumLength = 2)]
        public string? Uf { get; set; }

        [StringLength(8, MinimumLength = 8)]
        public string? Cep { get; set; }
    }
}
