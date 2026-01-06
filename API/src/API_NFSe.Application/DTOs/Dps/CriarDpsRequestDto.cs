using System;
using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Dps
{
    public class CriarDpsRequestDto
    {
        [Required]
        [StringLength(5)]
        public string Versao { get; set; } = "1.00";

        [Required]
        [StringLength(60)]
        public string Identificador { get; set; } = string.Empty;

        [Required]
        [Range(1, 2)]
        public int Ambiente { get; set; }

        [Required]
        public DateTimeOffset DataHoraEmissao { get; set; }

        [Required]
        [StringLength(50)]
        public string VersaoAplicacao { get; set; } = string.Empty;

        [Required]
        [StringLength(5)]
        public string Serie { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string NumeroDps { get; set; } = string.Empty;

        [Required]
        public DateTime DataCompetencia { get; set; }

        [Required]
        [Range(1, 2)]
        public int TipoEmissao { get; set; }

        [Required]
        [StringLength(7, MinimumLength = 7)]
        public string CodigoLocalEmissao { get; set; } = string.Empty;

        [Required]
        public CriarDpsRegimeTributarioDto RegimeTributario { get; set; } = new();

        [Required]
        public CriarDpsTomadorDto Tomador { get; set; } = new();

        [Required]
        public CriarDpsServicoDto Servico { get; set; } = new();

        [Required]
        public CriarDpsValoresDto Valores { get; set; } = new();

        [Required]
        public string XmlAssinado { get; set; } = string.Empty;

        [Required]
        public string JsonEntrada { get; set; } = string.Empty;

        [StringLength(256)]
        public string? DigestValue { get; set; }

        [StringLength(50)]
        public string? Status { get; set; }

        [StringLength(50)]
        public string? Protocolo { get; set; }

        [StringLength(1000)]
        public string? MensagemErro { get; set; }

        public DateTimeOffset? DataEnvio { get; set; }

        public DateTimeOffset? DataRetorno { get; set; }
    }

    public class CriarDpsRegimeTributarioDto
    {
        [Required]
        [Range(0, 2)]
        public int OptanteSimplesNacional { get; set; }

        [Required]
        [Range(0, 9)]
        public int RegimeEspecial { get; set; }
    }

    public class CriarDpsTomadorDto
    {
        [Required]
        [StringLength(5)]
        public string TipoDocumento { get; set; } = string.Empty;

        [Required]
        [StringLength(14, MinimumLength = 11)]
        public string Documento { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        [Phone]
        public string? Telefone { get; set; }

        [Required]
        public CriarDpsEnderecoDto Endereco { get; set; } = new();
    }

    public class CriarDpsEnderecoDto
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

    public class CriarDpsServicoDto
    {
        [Required]
        [StringLength(7, MinimumLength = 7)]
        public string CodigoLocalPrestacao { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string CodigoTributacaoNacional { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string CodigoTributacaoMunicipal { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string DescricaoServico { get; set; } = string.Empty;

        [StringLength(1024)]
        public string? InformacoesComplementares { get; set; }
    }

    public class CriarDpsValoresDto
    {
        [Required]
        [Range(0, double.MaxValue)]
        public decimal ValorServico { get; set; }

        [Required]
        public CriarDpsTributosDto Tributos { get; set; } = new();
    }

    public class CriarDpsTributosDto
    {
        [Required]
        [Range(0, 1)]
        public int IssRetido { get; set; }

        [Required]
        [Range(1, 2)]
        public int TipoRetencaoIss { get; set; }

        [Required]
        public CriarDpsTributosTotaisDto Totais { get; set; } = new();
    }

    public class CriarDpsTributosTotaisDto
    {
        [Range(0, double.MaxValue)]
        public decimal Federal { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Estadual { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Municipal { get; set; }
    }
}
