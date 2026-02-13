using System;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using System.Xml;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class XmlSignatureService : IXmlSignatureService
    {
        public string SignXml(string xmlContent, string tagName, X509Certificate2 certificate)
        {
            if (string.IsNullOrWhiteSpace(xmlContent))
            {
                throw new ArgumentException("O XML a ser assinado é obrigatório.", nameof(xmlContent));
            }

            if (string.IsNullOrWhiteSpace(tagName))
            {
                throw new ArgumentException("A tag alvo da assinatura é obrigatória.", nameof(tagName));
            }

            if (certificate is null)
            {
                throw new ArgumentNullException(nameof(certificate));
            }

            if (!certificate.HasPrivateKey)
            {
                throw new InvalidOperationException("O certificado informado não possui chave privada para assinatura.");
            }

            var xmlDoc = new XmlDocument { PreserveWhitespace = true };
            xmlDoc.LoadXml(xmlContent);

            if (xmlDoc.GetElementsByTagName(tagName).Item(0) is not XmlElement targetElement)
            {
                throw new InvalidOperationException($"A tag '{tagName}' não foi encontrada no XML informado.");
            }

            using var rsa = certificate.GetRSAPrivateKey() ?? throw new InvalidOperationException("Não foi possível obter a chave privada RSA do certificado.");
            var signedXml = new SignedXml(xmlDoc) { SigningKey = rsa };

            var reference = new Reference
            {
                Uri = "#" + EnsureElementId(targetElement),
                DigestMethod = SignedXml.XmlDsigSHA256Url
            };
            reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
            reference.AddTransform(new XmlDsigExcC14NTransform());
            signedXml.AddReference(reference);

            var keyInfo = new KeyInfo();
            keyInfo.AddClause(new KeyInfoX509Data(certificate));
            signedXml.KeyInfo = keyInfo;
            var signedInfo = signedXml.SignedInfo ?? throw new InvalidOperationException("Não foi possível gerar as informações de assinatura do XML.");
            signedInfo.SignatureMethod = SignedXml.XmlDsigRSASHA256Url;
            signedInfo.CanonicalizationMethod = SignedXml.XmlDsigExcC14NTransformUrl;

            signedXml.ComputeSignature();
            var xmlDigitalSignature = signedXml.GetXml();
            targetElement.AppendChild(xmlDoc.ImportNode(xmlDigitalSignature, deep: true));

            return xmlDoc.OuterXml;
        }

        private static string EnsureElementId(XmlElement element)
        {
            var existing = element.GetAttributeNode("Id") ??
                           element.GetAttributeNode("ID") ??
                           element.GetAttributeNode("id");
            if (existing is null || string.IsNullOrWhiteSpace(existing.Value))
            {
                var generated = "id-" + Guid.NewGuid().ToString("N");
                element.SetAttribute("Id", generated);
                return generated;
            }

            return existing.Value;
        }
    }
}
