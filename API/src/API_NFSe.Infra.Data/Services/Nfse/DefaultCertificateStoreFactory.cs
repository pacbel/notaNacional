using System.Security.Cryptography.X509Certificates;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class DefaultCertificateStoreFactory : ICertificateStoreFactory
    {
        public X509Store Create(StoreName storeName, StoreLocation storeLocation)
        {
            return new X509Store(storeName, storeLocation);
        }
    }
}
