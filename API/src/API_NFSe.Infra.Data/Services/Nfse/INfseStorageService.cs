using System;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface INfseStorageService
    {
        string SaveContent(byte[] content, string contentType, string direction);
        void SaveStructuredLog(string direction, string url, int ambiente, string? certificateSuffix, string contentType, int statusCode, string contentId);
        void SaveEmitResponse(string? chaveAcesso, string? numero, string? xmlNfse, string? nfseBase64);
    }
}
