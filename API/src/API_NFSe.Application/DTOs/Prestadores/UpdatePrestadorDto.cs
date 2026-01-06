using System;
using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class UpdatePrestadorDto
    {
        [Required]
        [StringLength(14, MinimumLength = 14)]
        public string Cnpj { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string RazaoSocial { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string NomeFantasia { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string InscricaoMunicipal { get; set; } = string.Empty;

        [StringLength(20)]
        public string? InscricaoEstadual { get; set; }

        [StringLength(10)]
        public string? Cnae { get; set; }

        [Required]
        public int TipoEmissao { get; set; }

        [Required]
        [StringLength(7, MinimumLength = 7)]
        public string CodigoMunicipioIbge { get; set; } = string.Empty;

        [Required]
        public int OptanteSimplesNacional { get; set; }

        [Required]
        public int RegimeEspecialTributario { get; set; }

        [Phone]
        public string? Telefone { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [Url]
        public string? Website { get; set; }

        [Required]
        public EnderecoDto Endereco { get; set; } = new();
    }
}
