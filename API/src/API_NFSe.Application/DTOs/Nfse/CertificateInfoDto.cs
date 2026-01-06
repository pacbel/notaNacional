using System;

namespace API_NFSe.Application.DTOs.Nfse
{
    public class CertificateInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string CommonName { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public DateTime NotBefore { get; set; }
        public DateTime NotAfter { get; set; }
        public bool HasPrivateKey { get; set; }
        public string StoreLocation { get; set; } = string.Empty;
    }
}
