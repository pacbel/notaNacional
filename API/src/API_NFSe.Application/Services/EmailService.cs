using System.Threading.Tasks;
using System;
using API_NFSe.Application.Configurations;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace API_NFSe.Application.Services
{
    public interface IEmailService
    {
        Task EnviarAsync(SmtpSettings settings, string destinatario, string assunto, string corpoHtml);
    }

    public class EmailService : IEmailService
    {
        public async Task EnviarAsync(SmtpSettings settings, string destinatario, string assunto, string corpoHtml)
        {
            if (settings is null)
            {
                throw new ArgumentNullException(nameof(settings));
            }

            var host = settings.Host;
            var port = settings.Port;
            var from = settings.From;

            if (string.IsNullOrWhiteSpace(host) || !port.HasValue || string.IsNullOrWhiteSpace(from))
            {
                throw new InvalidOperationException("Configuração SMTP incompleta para envio de e-mails.");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(settings.FromName, from));
            message.To.Add(MailboxAddress.Parse(destinatario));
            message.Subject = assunto;

            var builder = new BodyBuilder
            {
                HtmlBody = corpoHtml
            };

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
}
