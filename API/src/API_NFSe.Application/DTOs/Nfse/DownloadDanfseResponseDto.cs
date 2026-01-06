using System;

namespace API_NFSe.Application.DTOs.Nfse
{
    public class DownloadDanfseResponseDto
    {
        public int StatusCode { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string RawContent { get; set; } = string.Empty;
    }
}
