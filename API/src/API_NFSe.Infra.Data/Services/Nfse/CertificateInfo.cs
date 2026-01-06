using System;

namespace API_NFSe.Infra.Data.Services.Nfse;

public readonly record struct CertificateInfo(
    Guid Id,
    string Alias,
    string Thumbprint,
    string CommonName,
    string Cnpj,
    DateTime NotBefore,
    DateTime NotAfter,
    DateTime DataEnvioUtc,
    long TamanhoBytes
);
