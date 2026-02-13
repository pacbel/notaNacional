using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsServico
    {
        public string CodigoLocalPrestacao { get; private set; } = string.Empty;
        public string CodigoTributacaoNacional { get; private set; } = string.Empty;
        public string CodigoTributacaoMunicipal { get; private set; } = string.Empty;
        public string DescricaoServico { get; private set; } = string.Empty;
        public string? InformacoesComplementares { get; private set; }

        protected DpsServico() { }

        public DpsServico(
            string codigoLocalPrestacao,
            string codigoTributacaoNacional,
            string codigoTributacaoMunicipal,
            string descricaoServico,
            string? informacoesComplementares)
        {
            if (string.IsNullOrWhiteSpace(codigoLocalPrestacao))
            {
                throw new ArgumentException("O código do local de prestação é obrigatório", nameof(codigoLocalPrestacao));
            }

            if (string.IsNullOrWhiteSpace(codigoTributacaoNacional))
            {
                throw new ArgumentException("O código de tributação nacional é obrigatório", nameof(codigoTributacaoNacional));
            }

            if (string.IsNullOrWhiteSpace(codigoTributacaoMunicipal))
            {
                throw new ArgumentException("O código de tributação municipal é obrigatório", nameof(codigoTributacaoMunicipal));
            }

            if (string.IsNullOrWhiteSpace(descricaoServico))
            {
                throw new ArgumentException("A descrição do serviço é obrigatória", nameof(descricaoServico));
            }

            CodigoLocalPrestacao = codigoLocalPrestacao.Trim();
            CodigoTributacaoNacional = codigoTributacaoNacional.Trim();
            CodigoTributacaoMunicipal = codigoTributacaoMunicipal.Trim();
            DescricaoServico = descricaoServico.Trim();
            InformacoesComplementares = string.IsNullOrWhiteSpace(informacoesComplementares)
                ? null
                : informacoesComplementares.Trim();
        }
    }
}
