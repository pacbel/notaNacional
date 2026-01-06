using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class PrestadorConfiguracao : EntityBase
    {
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        public int Ambiente { get; private set; }
        public string VersaoAplicacao { get; private set; } = string.Empty;
        public string SeriePadrao { get; private set; } = string.Empty;
        public long NumeroAtual { get; private set; }
        public string? UrlEnvio { get; private set; }
        public string? UrlConsulta { get; private set; }
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
            int ambiente,
            string versaoAplicacao,
            string seriePadrao,
            long numeroAtual,
            string? urlEnvio,
            string? urlConsulta,
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

            if (string.IsNullOrWhiteSpace(seriePadrao))
            {
                throw new ArgumentException("A série padrão é obrigatória", nameof(seriePadrao));
            }

            PrestadorId = prestadorId;
            Ambiente = ambiente;
            VersaoAplicacao = versaoAplicacao.Trim();
            SeriePadrao = seriePadrao.Trim();
            NumeroAtual = numeroAtual;
            UrlEnvio = string.IsNullOrWhiteSpace(urlEnvio) ? null : urlEnvio.Trim();
            UrlConsulta = string.IsNullOrWhiteSpace(urlConsulta) ? null : urlConsulta.Trim();
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
            int ambiente,
            string versaoAplicacao,
            string seriePadrao,
            long numeroAtual,
            string? urlEnvio,
            string? urlConsulta,
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
            Ambiente = ambiente;
            VersaoAplicacao = string.IsNullOrWhiteSpace(versaoAplicacao) ? VersaoAplicacao : versaoAplicacao.Trim();
            SeriePadrao = string.IsNullOrWhiteSpace(seriePadrao) ? SeriePadrao : seriePadrao.Trim();
            NumeroAtual = numeroAtual;
            UrlEnvio = string.IsNullOrWhiteSpace(urlEnvio) ? null : urlEnvio.Trim();
            UrlConsulta = string.IsNullOrWhiteSpace(urlConsulta) ? null : urlConsulta.Trim();
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

        public long GerarProximoNumero()
        {
            NumeroAtual += 1;
            AtualizarDataAtualizacao();
            return NumeroAtual;
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
