using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class PrestadorCertificado : EntityBase
    {
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        public string Alias { get; private set; } = string.Empty;
        public string TipoArmazenamento { get; private set; } = string.Empty;
        public string DadosCertificado { get; private set; } = string.Empty;
        public string? SenhaProtegida { get; private set; }
        public DateTime DataValidade { get; private set; }
        public Guid AtualizadoPorUsuarioId { get; private set; }

        protected PrestadorCertificado() { }

        public PrestadorCertificado(
            Guid prestadorId,
            string alias,
            string tipoArmazenamento,
            string dadosCertificado,
            string? senhaProtegida,
            DateTime dataValidade,
            Guid atualizadoPorUsuarioId)
        {
            if (string.IsNullOrWhiteSpace(alias))
            {
                throw new ArgumentException("O alias do certificado é obrigatório", nameof(alias));
            }

            if (string.IsNullOrWhiteSpace(tipoArmazenamento))
            {
                throw new ArgumentException("O tipo de armazenamento é obrigatório", nameof(tipoArmazenamento));
            }

            if (string.IsNullOrWhiteSpace(dadosCertificado))
            {
                throw new ArgumentException("Os dados do certificado são obrigatórios", nameof(dadosCertificado));
            }

            PrestadorId = prestadorId;
            Alias = alias.Trim();
            TipoArmazenamento = tipoArmazenamento.Trim();
            DadosCertificado = dadosCertificado;
            SenhaProtegida = string.IsNullOrWhiteSpace(senhaProtegida) ? null : senhaProtegida;
            DataValidade = dataValidade;
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;
        }

        public void Atualizar(
            string alias,
            string tipoArmazenamento,
            string dadosCertificado,
            string? senhaProtegida,
            DateTime dataValidade,
            Guid atualizadoPorUsuarioId)
        {
            Alias = string.IsNullOrWhiteSpace(alias) ? Alias : alias.Trim();
            TipoArmazenamento = string.IsNullOrWhiteSpace(tipoArmazenamento) ? TipoArmazenamento : tipoArmazenamento.Trim();
            DadosCertificado = string.IsNullOrWhiteSpace(dadosCertificado) ? DadosCertificado : dadosCertificado;
            SenhaProtegida = string.IsNullOrWhiteSpace(senhaProtegida) ? null : senhaProtegida;
            DataValidade = dataValidade;
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;
            AtualizarDataAtualizacao();
        }
    }
}
