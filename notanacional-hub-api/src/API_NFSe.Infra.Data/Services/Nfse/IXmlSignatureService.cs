using System.Security.Cryptography.X509Certificates;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public interface IXmlSignatureService
    {
        string SignXml(string xmlContent, string tagName, X509Certificate2 certificate);
    }
}
