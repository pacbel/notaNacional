using System;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface ICertificateStoreService
    {
        Task<IReadOnlyCollection<CertificateInfo>> ListCertificatesAsync(CancellationToken cancellationToken = default);
        Task<CertificateInfo?> GetInfoAsync(Guid certificateId, CancellationToken cancellationToken = default);
        Task<X509Certificate2?> LoadAsync(Guid certificateId, CancellationToken cancellationToken = default);
    }
}
