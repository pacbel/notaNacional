namespace API_NFSe.Application.DTOs.Nfse
{
    public class CancelarNfseResponseDto
    {
        public int StatusCode { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
