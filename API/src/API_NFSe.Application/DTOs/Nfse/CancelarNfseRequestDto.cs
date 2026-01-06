namespace API_NFSe.Application.DTOs.Nfse
{
    public class CancelarNfseRequestDto
    {
        public string ChaveAcesso { get; set; } = string.Empty;
        public string EventoXmlGZipBase64 { get; set; } = string.Empty;
        public int Ambiente { get; set; }
        public string CertificateId { get; set; } = string.Empty;
    }
}
