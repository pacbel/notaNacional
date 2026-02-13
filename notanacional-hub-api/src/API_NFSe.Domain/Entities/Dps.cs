using System;
using API_NFSe.Domain.Common;
using API_NFSe.Domain.ValueObjects;

namespace API_NFSe.Domain.Entities
{
    public class Dps : EntityBase
    {
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        public Guid UsuarioId { get; private set; }
        public Usuario Usuario { get; private set; } = null!;

        public string Versao { get; private set; } = string.Empty;
        public string Identificador { get; private set; } = string.Empty;
        public int Ambiente { get; private set; }
        public DateTimeOffset DataHoraEmissao { get; private set; }
        public string VersaoAplicacao { get; private set; } = string.Empty;
        public string Serie { get; private set; } = string.Empty;
        public string NumeroDps { get; private set; } = string.Empty;
        public DateTime DataCompetencia { get; private set; }
        public int TipoEmissao { get; private set; }
        public string CodigoLocalEmissao { get; private set; } = string.Empty;

        public DpsRegimeTributario RegimeTributario { get; private set; } = null!;
        public DpsTomador Tomador { get; private set; } = null!;
        public DpsServico Servico { get; private set; } = null!;
        public DpsValores Valores { get; private set; } = null!;

        public string XmlAssinado { get; private set; } = string.Empty;
        public string JsonEntrada { get; private set; } = string.Empty;
        public string? DigestValue { get; private set; }
        public string Status { get; private set; } = string.Empty;
        public string? Protocolo { get; private set; }
        public string? MensagemErro { get; private set; }
        public DateTimeOffset? DataEnvio { get; private set; }
        public DateTimeOffset? DataRetorno { get; private set; }

        protected Dps() { }

        public Dps(
            Guid prestadorId,
            Guid usuarioId,
            string versao,
            string identificador,
            int ambiente,
            DateTimeOffset dataHoraEmissao,
            string versaoAplicacao,
            string serie,
            string numeroDps,
            DateTime dataCompetencia,
            int tipoEmissao,
            string codigoLocalEmissao,
            DpsRegimeTributario regimeTributario,
            DpsTomador tomador,
            DpsServico servico,
            DpsValores valores,
            string xmlAssinado,
            string jsonEntrada,
            string status)
        {
            if (string.IsNullOrWhiteSpace(versao))
            {
                throw new ArgumentException("A versão do DPS é obrigatória", nameof(versao));
            }

            if (string.IsNullOrWhiteSpace(identificador))
            {
                throw new ArgumentException("O identificador do DPS é obrigatório", nameof(identificador));
            }

            if (string.IsNullOrWhiteSpace(versaoAplicacao))
            {
                throw new ArgumentException("A versão da aplicação é obrigatória", nameof(versaoAplicacao));
            }

            if (string.IsNullOrWhiteSpace(serie))
            {
                throw new ArgumentException("A série do DPS é obrigatória", nameof(serie));
            }

            if (string.IsNullOrWhiteSpace(numeroDps))
            {
                throw new ArgumentException("O número do DPS é obrigatório", nameof(numeroDps));
            }

            if (string.IsNullOrWhiteSpace(codigoLocalEmissao))
            {
                throw new ArgumentException("O código do local de emissão é obrigatório", nameof(codigoLocalEmissao));
            }

            if (string.IsNullOrWhiteSpace(xmlAssinado))
            {
                throw new ArgumentException("O XML assinado é obrigatório", nameof(xmlAssinado));
            }

            if (string.IsNullOrWhiteSpace(jsonEntrada))
            {
                throw new ArgumentException("O JSON de entrada é obrigatório", nameof(jsonEntrada));
            }

            if (string.IsNullOrWhiteSpace(status))
            {
                throw new ArgumentException("O status do DPS é obrigatório", nameof(status));
            }

            PrestadorId = prestadorId;
            UsuarioId = usuarioId;
            Versao = versao.Trim();
            Identificador = identificador.Trim();
            Ambiente = ambiente;
            DataHoraEmissao = dataHoraEmissao;
            VersaoAplicacao = versaoAplicacao.Trim();
            Serie = serie.Trim();
            NumeroDps = numeroDps.Trim();
            DataCompetencia = dataCompetencia;
            TipoEmissao = tipoEmissao;
            CodigoLocalEmissao = codigoLocalEmissao.Trim();
            RegimeTributario = regimeTributario ?? throw new ArgumentNullException(nameof(regimeTributario));
            Tomador = tomador ?? throw new ArgumentNullException(nameof(tomador));
            Servico = servico ?? throw new ArgumentNullException(nameof(servico));
            Valores = valores ?? throw new ArgumentNullException(nameof(valores));
            XmlAssinado = xmlAssinado;
            JsonEntrada = jsonEntrada;
            Status = status;
        }

        public void AtualizarAssinatura(string xmlAssinado, string? digestValue)
        {
            if (string.IsNullOrWhiteSpace(xmlAssinado))
            {
                throw new ArgumentException("O XML assinado é obrigatório", nameof(xmlAssinado));
            }

            XmlAssinado = xmlAssinado;
            DigestValue = string.IsNullOrWhiteSpace(digestValue) ? null : digestValue;
            AtualizarDataAtualizacao();
        }

        public void DefinirEnvio(DateTimeOffset dataEnvio)
        {
            DataEnvio = dataEnvio;
            AtualizarDataAtualizacao();
        }

        public void AtualizarRetorno(string status, string? protocolo, string? mensagemErro, DateTimeOffset? dataRetorno)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                throw new ArgumentException("O status é obrigatório", nameof(status));
            }

            Status = status.Trim();
            Protocolo = string.IsNullOrWhiteSpace(protocolo) ? null : protocolo.Trim();
            MensagemErro = string.IsNullOrWhiteSpace(mensagemErro) ? null : mensagemErro.Trim();
            DataRetorno = dataRetorno;
            AtualizarDataAtualizacao();
        }
    }
}
