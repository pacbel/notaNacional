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

        public int? CreditoMensalPadrao { get; private set; }
        public int SaldoNotasDisponiveis { get; private set; }
        public DateTime? CompetenciaSaldo { get; private set; }

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
            string? smtpResetPasswordUrl,
            int? creditoMensalPadrao = null,
            int? saldoNotasDisponiveis = null,
            DateTime? competenciaSaldo = null)
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

            ConfigurarBilhetagemInterno(creditoMensalPadrao, saldoNotasDisponiveis, competenciaSaldo, atualizarData: false);
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
            string? smtpResetPasswordUrl,
            int? creditoMensalPadrao = null,
            int? saldoNotasDisponiveis = null,
            DateTime? competenciaSaldo = null)
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

            ConfigurarBilhetagemInterno(creditoMensalPadrao, saldoNotasDisponiveis, competenciaSaldo, atualizarData: true, preservarCompetencia: true);
        }

        public void AtribuirPrestador(Prestador prestador)
        {
            PrestadorId = prestador.Id;
            Prestador = prestador;
        }

        public void ConfigurarBilhetagem(int? creditoMensalPadrao, int? saldoNotasDisponiveis, DateTime? competenciaSaldo)
        {
            ConfigurarBilhetagemInterno(creditoMensalPadrao, saldoNotasDisponiveis, competenciaSaldo, atualizarData: true);
        }

        public bool BilhetagemAtiva() => CreditoMensalPadrao.HasValue && CreditoMensalPadrao.Value > 0;

        public void RenovarSaldoSeNecessario(DateTime referenciaUtc)
        {
            if (!CreditoMensalPadrao.HasValue)
            {
                CompetenciaSaldo = null;
                return;
            }

            var competenciaAtual = new DateTime(referenciaUtc.Year, referenciaUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            if (!CompetenciaSaldo.HasValue || CompetenciaDiferente(CompetenciaSaldo.Value, competenciaAtual))
            {
                SaldoNotasDisponiveis = CreditoMensalPadrao.Value;
                CompetenciaSaldo = competenciaAtual;
                AtualizarDataAtualizacao();
            }
        }

        public void ReservarCredito()
        {
            if (!CreditoMensalPadrao.HasValue)
            {
                return;
            }

            if (SaldoNotasDisponiveis <= 0)
            {
                throw new InvalidOperationException("Saldo de emissões insuficiente para gerar uma nova NFSe.");
            }

            SaldoNotasDisponiveis -= 1;
            AtualizarDataAtualizacao();
        }

        public void EstornarCredito()
        {
            if (!CreditoMensalPadrao.HasValue)
            {
                return;
            }

            SaldoNotasDisponiveis += 1;
            AtualizarDataAtualizacao();
        }

        public void AdicionarCreditos(int quantidade, Guid usuarioId)
        {
            if (quantidade <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(quantidade), "A quantidade de créditos deve ser maior que zero.");
            }

            SaldoNotasDisponiveis += quantidade;
            if (usuarioId != Guid.Empty)
            {
                AtualizadoPorUsuarioId = usuarioId;
            }
            AtualizarDataAtualizacao();
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

        private void ConfigurarBilhetagemInterno(int? creditoMensalPadrao, int? saldoNotasDisponiveis, DateTime? competenciaSaldo, bool atualizarData, bool preservarCompetencia = false)
        {
            if (creditoMensalPadrao.HasValue && creditoMensalPadrao.Value < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(creditoMensalPadrao), "A quantidade mensal de créditos deve ser maior ou igual a zero.");
            }

            var habilitarControle = creditoMensalPadrao.HasValue && creditoMensalPadrao.Value > 0;

            if (saldoNotasDisponiveis.HasValue && saldoNotasDisponiveis.Value < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(saldoNotasDisponiveis), "O saldo disponível deve ser maior ou igual a zero.");
            }

            if (!habilitarControle)
            {
                CreditoMensalPadrao = null;
                if (saldoNotasDisponiveis.HasValue)
                {
                    SaldoNotasDisponiveis = saldoNotasDisponiveis.Value;
                }
                else if (!preservarCompetencia)
                {
                    SaldoNotasDisponiveis = 0;
                }

                if (!preservarCompetencia)
                {
                    CompetenciaSaldo = null;
                }
            }
            else
            {
                CreditoMensalPadrao = creditoMensalPadrao;
                if (!saldoNotasDisponiveis.HasValue)
                {
                    saldoNotasDisponiveis = CreditoMensalPadrao.Value;
                }
                if (saldoNotasDisponiveis.HasValue)
                {
                    SaldoNotasDisponiveis = saldoNotasDisponiveis.Value;
                }

                if (!preservarCompetencia)
                {
                    CompetenciaSaldo = competenciaSaldo?.Kind switch
                    {
                        DateTimeKind.Utc => competenciaSaldo,
                        DateTimeKind.Local => competenciaSaldo?.ToUniversalTime(),
                        _ => competenciaSaldo.HasValue
                            ? DateTime.SpecifyKind(competenciaSaldo.Value, DateTimeKind.Utc)
                            : competenciaSaldo
                    };
                }
            }

            if (atualizarData)
            {
                AtualizarDataAtualizacao();
            }
        }

        private static bool CompetenciaDiferente(DateTime atual, DateTime comparacao)
        {
            return atual.Year != comparacao.Year || atual.Month != comparacao.Month;
        }
    }
}
