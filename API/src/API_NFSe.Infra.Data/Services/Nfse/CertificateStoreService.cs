using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Services;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class FileSystemCertificateStoreService : ICertificateStoreService
    {
        private readonly IPrestadorCertificadoRepository _certificadoRepository;
        private readonly ICertificateFileStorage _fileStorage;
        private readonly ICryptographyService _cryptographyService;

        public FileSystemCertificateStoreService(
            IPrestadorCertificadoRepository certificadoRepository,
            ICertificateFileStorage fileStorage,
            ICryptographyService cryptographyService)
        {
            _certificadoRepository = certificadoRepository;
            _fileStorage = fileStorage;
            _cryptographyService = cryptographyService;
        }

        public async Task<IReadOnlyCollection<CertificateInfo>> ListCertificatesAsync(CancellationToken cancellationToken = default)
        {
            var certificados = await _certificadoRepository.ObterTodosAtivosAsync();

            return certificados
                .Select(Mapear)
                .OrderBy(c => c.CommonName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(c => c.Cnpj, StringComparer.Ordinal)
                .ToArray();
        }

        public async Task<CertificateInfo?> GetInfoAsync(Guid certificateId, CancellationToken cancellationToken = default)
        {
            var certificado = await _certificadoRepository.ObterPorIdAsync(certificateId);
            if (certificado is null)
            {
                return null;
            }

            return Mapear(certificado);
        }

        public async Task<X509Certificate2?> LoadAsync(Guid certificateId, CancellationToken cancellationToken = default)
        {
            var certificado = await _certificadoRepository.ObterPorIdAsync(certificateId);
            if (certificado is null)
            {
                return null;
            }

            var conteudo = await _fileStorage.ReadAsync(certificado.CaminhoRelativo, cancellationToken);
            var senha = string.IsNullOrWhiteSpace(certificado.SenhaProtegida)
                ? ReadOnlySpan<char>.Empty
                : _cryptographyService.Decrypt(certificado.SenhaProtegida).AsSpan();

            return X509CertificateLoader.LoadPkcs12(
                conteudo,
                senha,
                X509KeyStorageFlags.Exportable | X509KeyStorageFlags.UserKeySet | X509KeyStorageFlags.PersistKeySet);
        }

        private static CertificateInfo Mapear(PrestadorCertificado certificado)
        {
            return new CertificateInfo(
                certificado.Id,
                certificado.Alias,
                certificado.Thumbprint,
                certificado.CommonName,
                certificado.Cnpj,
                certificado.NotBefore,
                certificado.NotAfter,
                certificado.DataEnvio,
                certificado.TamanhoBytes);
        }
    }
}
