namespace API_NFSe.Application.DTOs.Nfse
{
    public class EmitirNfseResponseDto
    {
        public string? NfseBase64Gzip { get; set; }
        public string? XmlNfse { get; set; }
        public string? ChaveAcesso { get; set; }
        public string? Numero { get; set; }
        public string? CodigoVerificacao { get; set; }
        public string? UrlNfse { get; set; }
        public int StatusCode { get; set; }
        public string RawResponseContentType { get; set; } = string.Empty;
        public string RawResponseContent { get; set; } = string.Empty;
    }
}
