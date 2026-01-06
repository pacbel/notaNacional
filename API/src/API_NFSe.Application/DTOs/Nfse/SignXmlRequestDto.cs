namespace API_NFSe.Application.DTOs.Nfse
{
    public class SignXmlRequestDto
    {
        public string Xml { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public string CertificateId { get; set; } = string.Empty;
    }
}
