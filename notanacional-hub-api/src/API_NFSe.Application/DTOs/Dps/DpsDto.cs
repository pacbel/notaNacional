using System;

namespace API_NFSe.Application.DTOs.Dps
{
    public class DpsDto
    {
        public Guid Id { get; set; }
        public Guid PrestadorId { get; set; }
        public Guid UsuarioId { get; set; }
        public string Versao { get; set; } = string.Empty;
        public string Identificador { get; set; } = string.Empty;
        public int Ambiente { get; set; }
        public DateTimeOffset DataHoraEmissao { get; set; }
        public string VersaoAplicacao { get; set; } = string.Empty;
        public string Serie { get; set; } = string.Empty;
        public string NumeroDps { get; set; } = string.Empty;
        public DateTime DataCompetencia { get; set; }
        public int TipoEmissao { get; set; }
        public string CodigoLocalEmissao { get; set; } = string.Empty;
        public RegimeTributarioDto RegimeTributario { get; set; } = new();
        public TomadorDto Tomador { get; set; } = new();
        public ServicoDto Servico { get; set; } = new();
        public ValoresDto Valores { get; set; } = new();
        public string XmlAssinado { get; set; } = string.Empty;
        public string JsonEntrada { get; set; } = string.Empty;
        public string? DigestValue { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Protocolo { get; set; }
        public string? MensagemErro { get; set; }
        public DateTimeOffset? DataEnvio { get; set; }
        public DateTimeOffset? DataRetorno { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
    }

    public class RegimeTributarioDto
    {
        public int OptanteSimplesNacional { get; set; }
        public int RegimeEspecial { get; set; }
    }

    public class TomadorDto
    {
        public string TipoDocumento { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public EnderecoDto Endereco { get; set; } = new();
    }

    public class EnderecoDto
    {
        public string Logradouro { get; set; } = string.Empty;
        public string Numero { get; set; } = string.Empty;
        public string? Complemento { get; set; }
        public string Bairro { get; set; } = string.Empty;
        public string CodigoMunicipioIbge { get; set; } = string.Empty;
        public string? Uf { get; set; }
        public string? Cep { get; set; }
    }

    public class ServicoDto
    {
        public string CodigoLocalPrestacao { get; set; } = string.Empty;
        public string CodigoTributacaoNacional { get; set; } = string.Empty;
        public string CodigoTributacaoMunicipal { get; set; } = string.Empty;
        public string DescricaoServico { get; set; } = string.Empty;
        public string? InformacoesComplementares { get; set; }
    }

    public class ValoresDto
    {
        public decimal ValorServico { get; set; }
        public TributosDto Tributos { get; set; } = new();
    }

    public class TributosDto
    {
        public int IssRetido { get; set; }
        public int TipoRetencaoIss { get; set; }
        public TributosTotaisDto Totais { get; set; } = new();
    }

    public class TributosTotaisDto
    {
        public decimal Federal { get; set; }
        public decimal Estadual { get; set; }
        public decimal Municipal { get; set; }
    }
}
