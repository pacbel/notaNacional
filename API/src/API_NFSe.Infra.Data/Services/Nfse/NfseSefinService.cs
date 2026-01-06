using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Nfse;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Services.Nfse.Parsing;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public class NfseSefinService : INfseSefinService
    {
        private readonly IDpsRepository _dpsRepository;
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly ICertificateStoreService _certificateStoreService;
        private readonly ISefinHttpClient _sefinHttpClient;
        private readonly INfseResponseParser _responseParser;
        private readonly INfseStorageService _storageService;

        public NfseSefinService(
            IDpsRepository dpsRepository,
            IPrestadorRepository prestadorRepository,
            ICertificateStoreService certificateStoreService,
            ISefinHttpClient sefinHttpClient,
            INfseResponseParser responseParser,
            INfseStorageService storageService)
        {
            _dpsRepository = dpsRepository ?? throw new ArgumentNullException(nameof(dpsRepository));
            _prestadorRepository = prestadorRepository ?? throw new ArgumentNullException(nameof(prestadorRepository));
            _certificateStoreService = certificateStoreService ?? throw new ArgumentNullException(nameof(certificateStoreService));
            _sefinHttpClient = sefinHttpClient ?? throw new ArgumentNullException(nameof(sefinHttpClient));
            _responseParser = responseParser ?? throw new ArgumentNullException(nameof(responseParser));
            _storageService = storageService ?? throw new ArgumentNullException(nameof(storageService));
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

            var certificadosQuery = _certificateStoreService.ListCertificates().AsEnumerable();

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

            var certificados = certificadosQuery
                .Select(c => new CertificateInfoDto
                {
                    Id = c.Id,
                    CommonName = c.CommonName,
                    Cnpj = c.Cnpj,
                    Subject = c.Subject,
                    Issuer = c.Issuer,
                    NotBefore = c.NotBefore,
                    NotAfter = c.NotAfter,
                    HasPrivateKey = c.HasPrivateKey,
                    StoreLocation = c.StoreLocation.ToString()
                })
                .ToArray();

            return certificados;
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

            var certificado = ObterCertificadoPrestador(prestadorCnpj, request.CertificateId);

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
            var certificado = ObterCertificadoPrestador(SomenteDigitos(prestador.Cnpj), request.CertificateId);

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
                certificado = ObterCertificadoPrestador(SomenteDigitos(prestador.Cnpj), request.CertificateId);
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

        private X509Certificate2 ObterCertificadoPrestador(string prestadorCnpj, string certificateId)
        {
            var certificadoInfo = _certificateStoreService.ListCertificates()
                .FirstOrDefault(c => string.Equals(c.Id, certificateId, StringComparison.OrdinalIgnoreCase));

            if (string.IsNullOrWhiteSpace(certificadoInfo.Id))
            {
                throw new InvalidOperationException("Certificado não encontrado no repositório local.");
            }

            if (!string.Equals(SomenteDigitos(certificadoInfo.Cnpj), prestadorCnpj, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("O certificado informado não pertence ao prestador autenticado.");
            }

            var certificado = _certificateStoreService.GetByThumbprint(certificateId);
            if (certificado is null)
            {
                throw new InvalidOperationException("Não foi possível carregar o certificado informado.");
            }

            return certificado;
        }

        private static bool AmbienteValido(int ambiente) => ambiente is 1 or 2;

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
