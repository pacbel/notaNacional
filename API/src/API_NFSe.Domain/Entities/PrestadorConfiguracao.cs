using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class PrestadorConfiguracao : EntityBase
    {
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        public string VersaoAplicacao { get; private set; } = string.Empty;
        public bool EnviaEmailAutomatico { get; private set; }
        public Guid AtualizadoPorUsuarioId { get; private set; }
        public string? SmtpHost { get; private set; }
        public int? SmtpPort { get; private set; }
        public bool SmtpSecure { get; private set; }
        public string? SmtpUser { get; private set; }
        public string? SmtpPasswordEncrypted { get; private set; }
        public string? SmtpFrom { get; private set; }
        public string? SmtpFromName { get; private set; }
        public string? SmtpResetPasswordUrl { get; private set; }

        protected PrestadorConfiguracao() { }

        public PrestadorConfiguracao(
            Guid prestadorId,
            string versaoAplicacao,
            bool enviaEmailAutomatico,
            Guid atualizadoPorUsuarioId,
            string? smtpHost,
            int? smtpPort,
            bool smtpSecure,
            string? smtpUser,
            string? smtpPasswordEncrypted,
            string? smtpFrom,
            string? smtpFromName,
            string? smtpResetPasswordUrl)
        {
            if (string.IsNullOrWhiteSpace(versaoAplicacao))
            {
                throw new ArgumentException("A versão da aplicação é obrigatória", nameof(versaoAplicacao));
            }

            PrestadorId = prestadorId;
            VersaoAplicacao = versaoAplicacao.Trim();
            EnviaEmailAutomatico = enviaEmailAutomatico;
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;

            AplicarSmtpConfiguracao(
                smtpHost,
                smtpPort,
                smtpSecure,
                smtpUser,
                smtpPasswordEncrypted,
                smtpFrom,
                smtpFromName,
                smtpResetPasswordUrl,
                atualizarDataAtualizacao: false
            );
        }

        public void Atualizar(
            string versaoAplicacao,
            bool enviaEmailAutomatico,
            Guid atualizadoPorUsuarioId,
            string? smtpHost,
            int? smtpPort,
            bool smtpSecure,
            string? smtpUser,
            string? smtpPasswordEncrypted,
            string? smtpFrom,
            string? smtpFromName,
            string? smtpResetPasswordUrl)
        {
            VersaoAplicacao = string.IsNullOrWhiteSpace(versaoAplicacao) ? VersaoAplicacao : versaoAplicacao.Trim();
            EnviaEmailAutomatico = enviaEmailAutomatico;
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;

            AplicarSmtpConfiguracao(
                smtpHost,
                smtpPort,
                smtpSecure,
                smtpUser,
                smtpPasswordEncrypted,
                smtpFrom,
                smtpFromName,
                smtpResetPasswordUrl,
                atualizarDataAtualizacao: true
            );
        }

        public void AtribuirPrestador(Prestador prestador)
        {
            PrestadorId = prestador.Id;
            Prestador = prestador;
        }

        public void DefinirSmtpConfiguracao(
            string? smtpHost,
            int? smtpPort,
            bool smtpSecure,
            string? smtpUser,
            string? smtpPasswordEncrypted,
            string? smtpFrom,
            string? smtpFromName,
            string? smtpResetPasswordUrl)
        {
            AplicarSmtpConfiguracao(
                smtpHost,
                smtpPort,
                smtpSecure,
                smtpUser,
                smtpPasswordEncrypted,
                smtpFrom,
                smtpFromName,
                smtpResetPasswordUrl,
                atualizarDataAtualizacao: true
            );
        }

        private void AplicarSmtpConfiguracao(
            string? smtpHost,
            int? smtpPort,
            bool smtpSecure,
            string? smtpUser,
            string? smtpPasswordEncrypted,
            string? smtpFrom,
            string? smtpFromName,
            string? smtpResetPasswordUrl,
            bool atualizarDataAtualizacao)
        {
            SmtpHost = string.IsNullOrWhiteSpace(smtpHost) ? null : smtpHost.Trim();
            SmtpPort = smtpPort;
            SmtpSecure = smtpSecure;
            SmtpUser = string.IsNullOrWhiteSpace(smtpUser) ? null : smtpUser.Trim();

            if (!string.IsNullOrWhiteSpace(smtpPasswordEncrypted))
            {
                SmtpPasswordEncrypted = smtpPasswordEncrypted;
            }

            SmtpFrom = string.IsNullOrWhiteSpace(smtpFrom) ? null : smtpFrom.Trim();
            SmtpFromName = string.IsNullOrWhiteSpace(smtpFromName) ? null : smtpFromName.Trim();
            SmtpResetPasswordUrl = string.IsNullOrWhiteSpace(smtpResetPasswordUrl) ? null : smtpResetPasswordUrl.Trim();

            if (atualizarDataAtualizacao)
            {
                AtualizarDataAtualizacao();
            }
        }
    }
}
