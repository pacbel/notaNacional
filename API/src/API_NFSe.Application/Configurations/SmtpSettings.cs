namespace API_NFSe.Application.Configurations
{
    public class SmtpSettings
    {
        public string? Host { get; set; }
        public int? Port { get; set; }
        public bool Secure { get; set; }
        public string? User { get; set; }
        public string? Password { get; set; }
        public string? From { get; set; }
        public string? FromName { get; set; }
        public string? ResetPasswordUrl { get; set; }
        public bool HasPassword => !string.IsNullOrWhiteSpace(Password);
        public bool EstaConfigurado => !string.IsNullOrWhiteSpace(Host) && Port.HasValue && !string.IsNullOrWhiteSpace(From);
    }
}
