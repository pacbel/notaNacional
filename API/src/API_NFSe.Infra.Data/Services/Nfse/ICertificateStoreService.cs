using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface ICertificateStoreService
    {
        IReadOnlyCollection<CertificateInfo> ListCertificates();
        X509Certificate2? GetByThumbprint(string? thumbprint);
    }
}
