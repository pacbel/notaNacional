using System;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class PrestadorCertificadoDto
    {
        public Guid Id { get; set; }
        public string Alias { get; set; } = string.Empty;
        public string Thumbprint { get; set; } = string.Empty;
        public string CommonName { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public DateTime NotBefore { get; set; }
        public DateTime NotAfter { get; set; }
        public DateTime DataEnvio { get; set; }
        public long TamanhoBytes { get; set; }
        public bool Ativo { get; set; }
    }
}
