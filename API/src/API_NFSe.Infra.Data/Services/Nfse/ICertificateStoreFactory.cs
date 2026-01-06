using System.Security.Cryptography.X509Certificates;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface ICertificateStoreFactory
    {
        X509Store Create(StoreName storeName, StoreLocation storeLocation);
    }
}
