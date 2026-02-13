using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface ISefinHttpClient
    {
        Task<SefinEmitirResponse> EmitirAsync(string xmlAssinado, int ambiente, X509Certificate2 certificado, CancellationToken cancellationToken);
        Task<SefinCancelarResponse> CancelarAsync(string chaveAcesso, string eventoBase64, int ambiente, X509Certificate2 certificado, CancellationToken cancellationToken);
        Task<SefinDanfseResponse> DownloadDanfseAsync(string chaveAcesso, int ambiente, X509Certificate2? certificado, CancellationToken cancellationToken);
    }
}
