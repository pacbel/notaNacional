using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Nfse;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Services;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Services.Nfse.Parsing;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public class NfseSefinService : INfseSefinService
    {
        private readonly IDpsRepository _dpsRepository;
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly IPrestadorCertificadoRepository _prestadorCertificadoRepository;
        private readonly ICertificateStoreService _certificateStoreService;
        private readonly ICertificateFileStorage _certificateFileStorage;
        private readonly ICryptographyService _cryptographyService;
        private readonly IXmlSignatureService _xmlSignatureService;
        private readonly ISefinHttpClient _sefinHttpClient;
        private readonly INfseResponseParser _responseParser;
        private readonly INfseStorageService _storageService;

        public NfseSefinService(
            IDpsRepository dpsRepository,
            IPrestadorRepository prestadorRepository,
            IPrestadorCertificadoRepository prestadorCertificadoRepository,
            ICertificateStoreService certificateStoreService,
            ICertificateFileStorage certificateFileStorage,
            ICryptographyService cryptographyService,
            ISefinHttpClient sefinHttpClient,
            INfseResponseParser responseParser,
            INfseStorageService storageService,
            IXmlSignatureService xmlSignatureService)
        {
            _dpsRepository = dpsRepository ?? throw new ArgumentNullException(nameof(dpsRepository));
            _prestadorRepository = prestadorRepository ?? throw new ArgumentNullException(nameof(prestadorRepository));
            _prestadorCertificadoRepository = prestadorCertificadoRepository ?? throw new ArgumentNullException(nameof(prestadorCertificadoRepository));
            _certificateStoreService = certificateStoreService ?? throw new ArgumentNullException(nameof(certificateStoreService));
            _certificateFileStorage = certificateFileStorage ?? throw new ArgumentNullException(nameof(certificateFileStorage));
            _cryptographyService = cryptographyService ?? throw new ArgumentNullException(nameof(cryptographyService));
            _sefinHttpClient = sefinHttpClient ?? throw new ArgumentNullException(nameof(sefinHttpClient));
            _responseParser = responseParser ?? throw new ArgumentNullException(nameof(responseParser));
            _storageService = storageService ?? throw new ArgumentNullException(nameof(storageService));
            _xmlSignatureService = xmlSignatureService ?? throw new ArgumentNullException(nameof(xmlSignatureService));
        }

        public async Task<IReadOnlyCollection<CertificateInfoDto>> ListarCertificadosAsync(string usuarioReferencia, Guid? prestadorId, bool listarTodosCertificados)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (!listarTodosCertificados && (!prestadorId.HasValue || prestadorId.Value == Guid.Empty))
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            var certificados = await _certificateStoreService.ListCertificatesAsync();
            var certificadosQuery = certificados.AsEnumerable();

            if (!listarTodosCertificados && prestadorId.HasValue)
            {
                var prestador = await _prestadorRepository.ObterPorIdAsync(prestadorId.Value);
                if (prestador is null)
                {
                    throw new UnauthorizedAccessException("Prestador não encontrado ou inativo para o usuário informado.");
                }

                var prestadorCnpj = SomenteDigitos(prestador.Cnpj);
                certificadosQuery = certificadosQuery
                    .Where(c => string.Equals(SomenteDigitos(c.Cnpj), prestadorCnpj, StringComparison.Ordinal));
            }

            return certificadosQuery
                .Select(c => new CertificateInfoDto
                {
                    Id = c.Id,
                    Alias = c.Alias,
                    Thumbprint = c.Thumbprint,
                    CommonName = c.CommonName,
                    Cnpj = c.Cnpj,
                    NotBefore = c.NotBefore,
                    NotAfter = c.NotAfter,
                    DataEnvio = c.DataEnvioUtc,
                    TamanhoBytes = c.TamanhoBytes
                })
                .ToArray();
        }

        public async Task<ListarNotasEmitidasResponseDto> ListarNotasEmitidasAsync(string usuarioReferencia, Guid prestadorId, ListarNotasEmitidasRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            request.EnsureValidPagination();

            if (!string.IsNullOrWhiteSpace(request.PrestadorId) && Guid.TryParse(request.PrestadorId, out var prestadorSolicitado) && prestadorSolicitado != prestadorId)
            {
                throw new UnauthorizedAccessException("Prestador informado não corresponde ao usuário autenticado.");
            }

            var prestador = await _prestadorRepository.ObterPorIdAsync(prestadorId);
            if (prestador is null)
            {
                throw new UnauthorizedAccessException("Prestador não encontrado ou inativo para o usuário informado.");
            }

            var query = _dpsRepository.QueryAtivos()
                .Where(d => d.PrestadorId == prestadorId);

            if (!string.IsNullOrWhiteSpace(request.ChaveAcesso))
            {
                var chave = request.ChaveAcesso.Trim();
                query = query.Where(d => d.Identificador.Contains(chave));
            }

            if (!string.IsNullOrWhiteSpace(request.Numero))
            {
                var numero = request.Numero.Trim();
                query = query.Where(d => d.NumeroDps.Contains(numero));
            }

            var total = await query.CountAsync();
            var skip = (request.Page - 1) * request.PageSize;

            var items = await query
                .OrderByDescending(d => d.DataHoraEmissao)
                .ThenByDescending(d => d.Id)
                .Skip(skip)
                .Take(request.PageSize)
                .Select(d => new
                {
                    d.PrestadorId,
                    PrestadorNome = d.Prestador != null ? d.Prestador.NomeFantasia : string.Empty,
                    d.Identificador,
                    d.Status,
                    d.DataHoraEmissao,
                    d.NumeroDps
                })
                .ToListAsync();

            var response = new ListarNotasEmitidasResponseDto
            {
                Total = total,
                Items = items.Select(d => new NotaEmitidaDto
                {
                    PrestadorId = d.PrestadorId.ToString(),
                    PrestadorNome = d.PrestadorNome,
                    ChaveAcesso = d.Identificador,
                    Numero = d.NumeroDps,
                    Situacao = d.Status,
                    EmitidaEm = d.DataHoraEmissao.ToString("O")
                }).ToList()
            };

            return response;
        }

        public async Task<EmitirNfseResponseDto> EmitirAsync(string usuarioReferencia, Guid prestadorId, EmitirNfseRequestDto request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.XmlAssinado))
            {
                throw new ArgumentException("Xml assinado é obrigatório.", nameof(request.XmlAssinado));
            }

            if (!AmbienteValido(request.Ambiente))
            {
                throw new ArgumentException("Ambiente inválido. Utilize 1 (produção) ou 2 (homologação).", nameof(request.Ambiente));
            }

            if (string.IsNullOrWhiteSpace(request.CertificateId))
            {
                throw new ArgumentException("Identificador do certificado é obrigatório.", nameof(request.CertificateId));
            }

            var prestador = await ObterPrestadorAtivoAsync(prestadorId);
            var prestadorCnpj = SomenteDigitos(prestador.Cnpj);

            var certificado = await ObterCertificadoPrestadorAsync(prestadorId, prestadorCnpj, request.CertificateId, cancellationToken);

            _ = _storageService.SaveContent(Encoding.UTF8.GetBytes(request.XmlAssinado), "application/xml", "request");

            var response = await _sefinHttpClient.EmitirAsync(request.XmlAssinado, request.Ambiente, certificado, cancellationToken);

            var responseId = _storageService.SaveContent(response.Content, response.ContentType, "response");
            RegistrarLogEstruturado(
                acao: "emitir",
                url: ObterUrlEmitir(request.Ambiente),
                ambiente: request.Ambiente,
                certificateId: request.CertificateId,
                contentType: response.ContentType,
                statusCode: response.StatusCode,
                contentId: responseId);

            var parsed = _responseParser.ParseEmitirResponse(response.StatusCode, response.ContentType, response.Content);
            _storageService.SaveEmitResponse(parsed.ChaveAcesso, parsed.Numero, parsed.XmlNfse, parsed.NfseBase64Gzip);

            return parsed;
        }

        public async Task<CancelarNfseResponseDto> CancelarAsync(string usuarioReferencia, Guid prestadorId, CancelarNfseRequestDto request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.EventoXmlGZipBase64))
            {
                throw new ArgumentException("Evento assinado é obrigatório.", nameof(request.EventoXmlGZipBase64));
            }

            if (!AmbienteValido(request.Ambiente))
            {
                throw new ArgumentException("Ambiente inválido. Utilize 1 (produção) ou 2 (homologação).", nameof(request.Ambiente));
            }

            if (string.IsNullOrWhiteSpace(request.CertificateId))
            {
                throw new ArgumentException("Identificador do certificado é obrigatório.", nameof(request.CertificateId));
            }

            if (string.IsNullOrWhiteSpace(request.ChaveAcesso))
            {
                throw new ArgumentException("Chave de acesso é obrigatória.", nameof(request.ChaveAcesso));
            }

            _ = Convert.FromBase64String(request.EventoXmlGZipBase64); // lança exceção caso inválido

            var prestador = await ObterPrestadorAtivoAsync(prestadorId);
            var certificado = await ObterCertificadoPrestadorAsync(prestadorId, SomenteDigitos(prestador.Cnpj), request.CertificateId, cancellationToken);

            _ = _storageService.SaveContent(Encoding.UTF8.GetBytes(request.EventoXmlGZipBase64), "application/json", "request");

            var response = await _sefinHttpClient.CancelarAsync(request.ChaveAcesso, request.EventoXmlGZipBase64, request.Ambiente, certificado, cancellationToken);

            var responseId = _storageService.SaveContent(response.Content, response.ContentType, "response");
            RegistrarLogEstruturado(
                acao: "cancelar",
                url: ObterUrlCancelar(request.Ambiente, request.ChaveAcesso),
                ambiente: request.Ambiente,
                certificateId: request.CertificateId,
                contentType: response.ContentType,
                statusCode: response.StatusCode,
                contentId: responseId);

            return _responseParser.ParseCancelarResponse(response.StatusCode, response.ContentType, response.Content);
        }

        public async Task<DownloadDanfseResponseDto> DownloadDanfseAsync(string usuarioReferencia, Guid prestadorId, DownloadDanfseRequestDto request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.ChaveAcesso))
            {
                throw new ArgumentException("Chave de acesso é obrigatória.", nameof(request.ChaveAcesso));
            }

            if (!AmbienteValido(request.Ambiente))
            {
                throw new ArgumentException("Ambiente inválido. Utilize 1 (produção) ou 2 (homologação).", nameof(request.Ambiente));
            }

            var prestador = await ObterPrestadorAtivoAsync(prestadorId);
            var chaveNormalizada = NormalizarChaveAcesso(request.ChaveAcesso);
            if (string.IsNullOrWhiteSpace(chaveNormalizada))
            {
                throw new ArgumentException("Chave de acesso inválida.", nameof(request.ChaveAcesso));
            }

            X509Certificate2? certificado = null;
            if (!string.IsNullOrWhiteSpace(request.CertificateId))
            {
                certificado = await ObterCertificadoPrestadorAsync(prestadorId, SomenteDigitos(prestador.Cnpj), request.CertificateId, cancellationToken);
            }

            var response = await _sefinHttpClient.DownloadDanfseAsync(chaveNormalizada, request.Ambiente, certificado, cancellationToken);

            var responseId = _storageService.SaveContent(response.Content, response.ContentType, "response");
            RegistrarLogEstruturado(
                acao: "danfse",
                url: ObterUrlDanfse(request.Ambiente, chaveNormalizada),
                ambiente: request.Ambiente,
                certificateId: request.CertificateId,
                contentType: response.ContentType,
                statusCode: response.StatusCode,
                contentId: responseId);

            return _responseParser.ParseDanfseResponse(response.StatusCode, response.ContentType, response.Content, chaveNormalizada);
        }

        public async Task<string> AssinarAsync(Guid prestadorId, SignXmlRequestDto request, CancellationToken cancellationToken)
        {
            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Xml))
            {
                throw new ArgumentException("XML a ser assinado é obrigatório.", nameof(request.Xml));
            }

            if (string.IsNullOrWhiteSpace(request.Tag))
            {
                throw new ArgumentException("Tag alvo da assinatura é obrigatória.", nameof(request.Tag));
            }

            if (string.IsNullOrWhiteSpace(request.CertificateId))
            {
                throw new ArgumentException("Identificador do certificado é obrigatório.", nameof(request.CertificateId));
            }

            var prestador = await ObterPrestadorAtivoAsync(prestadorId);
            var prestadorCnpj = SomenteDigitos(prestador.Cnpj);

            var certificado = await ObterCertificadoPrestadorAsync(prestadorId, prestadorCnpj, request.CertificateId, cancellationToken);

            var now = DateTime.UtcNow;
            if (certificado.NotAfter.ToUniversalTime() < now)
            {
                throw new InvalidOperationException("O certificado informado está expirado.");
            }

            if (certificado.NotBefore.ToUniversalTime() > now)
            {
                throw new InvalidOperationException("O certificado informado ainda não está válido.");
            }

            return _xmlSignatureService.SignXml(request.Xml, request.Tag, certificado);
        }

        private static string SomenteDigitos(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                return string.Empty;
            }

            var buffer = new char[valor.Length];
            var indice = 0;

            foreach (var caractere in valor)
            {
                if (char.IsDigit(caractere))
                {
                    buffer[indice++] = caractere;
                }
            }

            return indice == 0 ? string.Empty : new string(buffer, 0, indice);
        }

        private async Task<Domain.Entities.Prestador> ObterPrestadorAtivoAsync(Guid prestadorId)
        {
            var prestador = await _prestadorRepository.ObterPorIdAsync(prestadorId);
            if (prestador is null)
            {
                throw new UnauthorizedAccessException("Prestador não encontrado ou inativo para o usuário informado.");
            }

            return prestador;
        }

        private async Task<X509Certificate2> ObterCertificadoPrestadorAsync(Guid prestadorId, string prestadorCnpj, string certificateId, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(certificateId, out var certificadoId))
            {
                throw new InvalidOperationException("Identificador de certificado inválido.");
            }

            PrestadorCertificado? certificado = null;
            const int maxTentativas = 3;

            for (var tentativa = 1; tentativa <= maxTentativas; tentativa++)
            {
                certificado = await _prestadorCertificadoRepository.ObterPorIdAsync(certificadoId);
                if (certificado is not null)
                {
                    break;
                }

                var certificadosPrestador = await _prestadorCertificadoRepository.ObterPorPrestadorAsync(prestadorId);
                certificado = certificadosPrestador.FirstOrDefault(c => c.Id == certificadoId);
                if (certificado is not null)
                {
                    break;
                }

                if (tentativa < maxTentativas)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(100 * tentativa), cancellationToken);
                }
            }

            var certificadoEncontrado = certificado ?? throw new InvalidOperationException($"Certificado com Id '{certificateId}' não encontrado para o prestador informado.");

            if (!string.Equals(SomenteDigitos(certificadoEncontrado.Cnpj), prestadorCnpj, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("O certificado informado não pertence ao prestador autenticado.");
            }

            var conteudo = await _certificateFileStorage.ReadAsync(certificadoEncontrado.CaminhoRelativo, cancellationToken);
            var senha = string.IsNullOrWhiteSpace(certificadoEncontrado.SenhaProtegida)
                ? ReadOnlySpan<char>.Empty
                : _cryptographyService.Decrypt(certificadoEncontrado.SenhaProtegida).AsSpan();

            var certificadoX509 = X509CertificateLoader.LoadPkcs12(
                conteudo,
                senha,
                ObterKeyStorageFlags());

            var agoraUtc = DateTime.UtcNow;
            if (certificadoX509.NotAfter.ToUniversalTime() < agoraUtc)
            {
                throw new InvalidOperationException("O certificado informado está expirado.");
            }

            if (certificadoX509.NotBefore.ToUniversalTime() > agoraUtc)
            {
                throw new InvalidOperationException("O certificado informado ainda não está válido.");
            }

            return certificadoX509;
        }

        private static bool AmbienteValido(int ambiente) => ambiente is 1 or 2;

        private static X509KeyStorageFlags ObterKeyStorageFlags()
        {
            var flags = X509KeyStorageFlags.Exportable;

            if (OperatingSystem.IsWindows())
            {
                flags |= X509KeyStorageFlags.UserKeySet | X509KeyStorageFlags.PersistKeySet;
            }
            else
            {
                flags |= X509KeyStorageFlags.EphemeralKeySet;
            }

            return flags;
        }

        private static string NormalizarChaveAcesso(string chave)
        {
            if (string.IsNullOrWhiteSpace(chave))
            {
                return string.Empty;
            }

            var normalizada = new string(chave.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());
            if (normalizada.StartsWith("NFS", StringComparison.OrdinalIgnoreCase))
            {
                normalizada = normalizada[3..];
            }

            return normalizada.Length is >= 30 and <= 50 ? normalizada : string.Empty;
        }

        private void RegistrarLogEstruturado(string acao, string url, int ambiente, string? certificateId, string contentType, int statusCode, string contentId)
        {
            var certificadoSuffix = string.IsNullOrWhiteSpace(certificateId)
                ? null
                : (certificateId.Length > 8 ? certificateId[^8..] : certificateId);

            _storageService.SaveStructuredLog(
                direction: acao,
                url: url,
                ambiente: ambiente,
                certificateSuffix: certificadoSuffix,
                contentType: contentType,
                statusCode: statusCode,
                contentId: contentId);
        }

        private static string ObterUrlEmitir(int ambiente)
        {
            return ambiente == 1
                ? "https://sefin.nfse.gov.br/SefinNacional/nfse"
                : "https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse";
        }

        private static string ObterUrlCancelar(int ambiente, string chaveAcesso)
        {
            var baseUrl = ambiente == 1
                ? "https://sefin.nfse.gov.br/SefinNacional"
                : "https://sefin.producaorestrita.nfse.gov.br/SefinNacional";
            return $"{baseUrl}/nfse/{Uri.EscapeDataString(chaveAcesso)}/eventos";
        }

        private static string ObterUrlDanfse(int ambiente, string chaveAcesso)
        {
            var baseUrl = ambiente == 1
                ? "https://adn.nfse.gov.br"
                : "https://adn.producaorestrita.nfse.gov.br";
            return $"{baseUrl}/danfse/{Uri.EscapeDataString(chaveAcesso)}";
        }
    }
}
