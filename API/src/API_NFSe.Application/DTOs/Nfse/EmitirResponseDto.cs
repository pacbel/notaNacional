namespace API_NFSe.Application.DTOs.Nfse
{
    public sealed class EmitirResponseDto
    {
        public string? NfseBase64Gzip { get; set; }
        public string? XmlNFSe { get; set; }
        public string? ChaveAcesso { get; set; }
        public string? Numero { get; set; }
        public string? CodigoVerificacao { get; set; }
        public string? UrlNfse { get; set; }
        public string? RawResponse { get; set; }
    }
}
