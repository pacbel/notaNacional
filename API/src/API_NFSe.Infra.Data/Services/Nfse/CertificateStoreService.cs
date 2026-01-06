using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text.RegularExpressions;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class CertificateStoreService : ICertificateStoreService
    {
        private readonly ICertificateStoreFactory _storeFactory;

        public CertificateStoreService()
            : this(new DefaultCertificateStoreFactory())
        {
        }

        public CertificateStoreService(ICertificateStoreFactory storeFactory)
        {
            _storeFactory = storeFactory;
        }

        public IReadOnlyCollection<CertificateInfo> ListCertificates()
        {
            var result = new List<CertificateInfo>();
            var now = DateTime.Now;

            foreach (var location in new[] { StoreLocation.CurrentUser, StoreLocation.LocalMachine })
            {
                using var store = _storeFactory.Create(StoreName.My, location);
                try
                {
                    store.Open(OpenFlags.ReadOnly | OpenFlags.OpenExistingOnly);
                    foreach (var cert in store.Certificates.Cast<X509Certificate2>())
                    {
                        var canSign = false;
                        try { canSign = cert.HasPrivateKey; } catch { /* ignore */ }
                        if (!canSign) continue;
                        if (now < cert.NotBefore || now > cert.NotAfter) continue;
                        if (!HasDigitalSignatureUsage(cert))
                        {
                            // Alguns certificados válidos para NFSe podem não expor a extensão.
                            // Mantemos fallback permissivo para não descartar certificados úteis.
                        }

                        var cnpj = ExtractCnpj(cert.Subject);
                        if (string.IsNullOrWhiteSpace(cnpj))
                        {
                            cnpj = ExtractCnpj(cert.Issuer);
                        }
                        if (string.IsNullOrWhiteSpace(cnpj)) continue;

                        result.Add(new CertificateInfo(
                            cert.Thumbprint ?? string.Empty,
                            ExtractCommonName(cert.Subject),
                            cnpj,
                            cert.Subject,
                            cert.Issuer,
                            cert.NotBefore,
                            cert.NotAfter,
                            canSign,
                            location));
                    }
                }
                catch
                {
                    // Ignora falhas ao abrir stores sem permissões.
                }
            }

            return result
                .OrderByDescending(c => c.HasPrivateKey)
                .ThenBy(c => c.CommonName, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        public X509Certificate2? GetByThumbprint(string? thumbprint)
        {
            if (string.IsNullOrWhiteSpace(thumbprint))
            {
                return null;
            }

            var normalized = thumbprint.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();

            foreach (var location in new[] { StoreLocation.CurrentUser, StoreLocation.LocalMachine })
            {
                using var store = _storeFactory.Create(StoreName.My, location);
                try
                {
                    store.Open(OpenFlags.ReadOnly | OpenFlags.OpenExistingOnly);
                    var found = store.Certificates.Find(X509FindType.FindByThumbprint, normalized, validOnly: false);
                    if (found.Count > 0)
                    {
                        return found[0];
                    }
                }
                catch
                {
                    // Ignora stores sem acesso.
                }
            }

            return null;
        }

        private static string ExtractCommonName(string subject)
        {
            if (string.IsNullOrWhiteSpace(subject)) return string.Empty;

            foreach (var part in subject.Split(','))
            {
                var trimmed = part.Trim();
                if (trimmed.StartsWith("CN=", StringComparison.OrdinalIgnoreCase))
                {
                    return trimmed[3..].Trim();
                }
            }

            return subject;
        }

        private static bool HasDigitalSignatureUsage(X509Certificate2 cert)
        {
            try
            {
                foreach (var ext in cert.Extensions)
                {
                    if (ext is X509KeyUsageExtension ku)
                    {
                        var flags = ku.KeyUsages;
                        if (flags.HasFlag(X509KeyUsageFlags.DigitalSignature) ||
                            flags.HasFlag(X509KeyUsageFlags.NonRepudiation))
                        {
                            return true;
                        }
                    }

                    if (ext is X509EnhancedKeyUsageExtension eku)
                    {
                        foreach (var oid in eku.EnhancedKeyUsages)
                        {
                            if (oid.Value is "1.3.6.1.5.5.7.3.2" or "1.3.6.1.5.5.7.3.3")
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            catch
            {
                // Ignora certificados com extensões inválidas.
            }

            return false;
        }

        private static string ExtractCnpj(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var match = Regex.Match(text, @"\b(\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}|\d{14})\b");
            if (!match.Success)
            {
                return string.Empty;
            }

            var digits = Regex.Replace(match.Value, "[^0-9]", string.Empty);
            return digits.Length == 14 ? digits : string.Empty;
        }
    }

    public readonly record struct CertificateInfo(
        string Id,
        string CommonName,
        string Cnpj,
        string Subject,
        string Issuer,
        DateTime NotBefore,
        DateTime NotAfter,
        bool HasPrivateKey,
        StoreLocation StoreLocation);
}
