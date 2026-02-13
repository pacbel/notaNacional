using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace API_NFSe.Application.Services
{
    public interface IEmailService
    {
        Task EnviarAsync(
            SmtpSettings settings,
            IEnumerable<string> destinatarios,
            string assunto,
            string corpoHtml,
            IEnumerable<EmailAttachment>? anexos = null
        );
    }

    public class EmailService : IEmailService
    {
        public async Task EnviarAsync(
            SmtpSettings settings,
            IEnumerable<string> destinatarios,
            string assunto,
            string corpoHtml,
            IEnumerable<EmailAttachment>? anexos = null
        )
        {
            if (settings is null)
            {
                throw new ArgumentNullException(nameof(settings));
            }

            if (destinatarios is null)
            {
                throw new ArgumentNullException(nameof(destinatarios));
            }

            var host = settings.Host;
            var port = settings.Port;
            var from = settings.From;

            if (string.IsNullOrWhiteSpace(host) || !port.HasValue || string.IsNullOrWhiteSpace(from))
            {
                throw new InvalidOperationException("Configuração SMTP incompleta para envio de e-mails.");
            }

            var destinatariosValidos = destinatarios
                .Select(destinatario => destinatario?.Trim())
                .Where(dest => !string.IsNullOrWhiteSpace(dest))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (destinatariosValidos.Count == 0)
            {
                throw new InvalidOperationException("Nenhum destinatário válido informado para envio de e-mails.");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(settings.FromName, from));

            foreach (var destinatario in destinatariosValidos)
            {
                message.To.Add(MailboxAddress.Parse(destinatario));
            }

            message.Subject = assunto;

            var builder = new BodyBuilder
            {
                HtmlBody = corpoHtml
            };

            if (anexos != null)
            {
                foreach (var anexo in anexos)
                {
                    if (anexo == null)
                    {
                        continue;
                    }

                    var nomeArquivo = string.IsNullOrWhiteSpace(anexo.FileName)
                        ? "anexo"
                        : anexo.FileName;

                    if (!string.IsNullOrWhiteSpace(anexo.ContentType))
                    {
                        try
                        {
                            var contentType = ContentType.Parse(anexo.ContentType);
                            builder.Attachments.Add(nomeArquivo, anexo.Content, contentType);
                            continue;
                        }
                        catch (FormatException)
                        {
                        }
                        catch (ArgumentException)
                        {
                        }
                    }

                    builder.Attachments.Add(nomeArquivo, anexo.Content);
                }
            }

            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            var secureOption = settings.Secure ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;
            await client.ConnectAsync(host, port.Value, secureOption);

            if (!string.IsNullOrWhiteSpace(settings.User))
            {
                await client.AuthenticateAsync(settings.User, settings.Password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }

    public class EmailAttachment
    {
        public EmailAttachment(string? fileName, byte[] content, string? contentType)
        {
            Content = content ?? throw new ArgumentNullException(nameof(content));
            FileName = string.IsNullOrWhiteSpace(fileName) ? null : fileName.Trim();
            ContentType = string.IsNullOrWhiteSpace(contentType) ? null : contentType.Trim();
        }

        public string? FileName { get; }
        public byte[] Content { get; }
        public string? ContentType { get; }
    }
}
