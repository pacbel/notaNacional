using API_NFSe.Application.DTOs.Nfse;

namespace API_NFSe.Infra.Data.Services.Nfse.Parsing
{
    public interface INfseResponseParser
    {
        EmitirNfseResponseDto ParseEmitirResponse(int statusCode, string contentType, byte[] content);
        CancelarNfseResponseDto ParseCancelarResponse(int statusCode, string contentType, byte[] content);
        DownloadDanfseResponseDto ParseDanfseResponse(int statusCode, string contentType, byte[] content, string chaveAcesso);
    }
}
