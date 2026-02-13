using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.DTOs.Emails;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Interfaces;

namespace API_NFSe.Application.Services
{
    public class EmailEnvioService : IEmailEnvioService
    {
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly ICryptographyService _cryptographyService;
        private readonly IEmailService _emailService;

        public EmailEnvioService(
            IPrestadorRepository prestadorRepository,
            ICryptographyService cryptographyService,
            IEmailService emailService)
        {
            _prestadorRepository = prestadorRepository ?? throw new ArgumentNullException(nameof(prestadorRepository));
            _cryptographyService = cryptographyService ?? throw new ArgumentNullException(nameof(cryptographyService));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        }

        public async Task EnviarAsync(Guid prestadorId, EnviarEmailRequestDto request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador?.Configuracao is null)
            {
                throw new InvalidOperationException("Configuração SMTP não encontrada para o prestador informado.");
            }

            var configuracao = prestador.Configuracao;

            if (string.IsNullOrWhiteSpace(configuracao.SmtpHost)
                || !configuracao.SmtpPort.HasValue
                || string.IsNullOrWhiteSpace(configuracao.SmtpFrom))
            {
                throw new InvalidOperationException("Configuração SMTP incompleta para o prestador informado.");
            }

            var senha = string.IsNullOrWhiteSpace(configuracao.SmtpPasswordEncrypted)
                ? null
                : _cryptographyService.Decrypt(configuracao.SmtpPasswordEncrypted);

            var smtpSettings = new SmtpSettings
            {
                Host = configuracao.SmtpHost,
                Port = configuracao.SmtpPort,
                Secure = configuracao.SmtpSecure,
                User = configuracao.SmtpUser,
                Password = senha,
                From = configuracao.SmtpFrom,
                FromName = configuracao.SmtpFromName
            };

            var anexos = ConverterAnexos(request.Anexos);

            await _emailService.EnviarAsync(
                smtpSettings,
                request.Destinatarios,
                request.Assunto,
                request.CorpoHtml,
                anexos
            );
        }

        private static IEnumerable<EmailAttachment>? ConverterAnexos(IEnumerable<EnviarEmailAttachmentDto>? anexos)
        {
            if (anexos is null)
            {
                return null;
            }

            var lista = new List<EmailAttachment>();

            foreach (var anexo in anexos)
            {
                if (anexo is null)
                {
                    throw new InvalidOperationException("Anexo inválido informado.");
                }

                byte[] conteudo;
                try
                {
                    conteudo = Convert.FromBase64String(anexo.ContentBase64);
                }
                catch (FormatException)
                {
                    throw new InvalidOperationException("Conteúdo Base64 inválido para um dos anexos informados.");
                }

                lista.Add(new EmailAttachment(anexo.FileName, conteudo, anexo.ContentType));
            }

            return lista;
        }
    }
}
