using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.DTOs.Prestadores;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace API_NFSe.Application.Services
{
    public class PrestadorService : IPrestadorService
    {
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<PrestadorService> _logger;
        private readonly ICryptographyService _cryptographyService;
        private readonly IPrestadorCertificadoRepository _certificadoRepository;
        private readonly ICertificateFileStorage _fileStorage;
        private readonly CertificateStorageSettings _storageSettings;

        public PrestadorService(
            IPrestadorRepository prestadorRepository,
            IMapper mapper,
            ILogger<PrestadorService> logger,
            ICryptographyService cryptographyService,
            IPrestadorCertificadoRepository certificadoRepository,
            ICertificateFileStorage fileStorage,
            CertificateStorageSettings storageSettings
        )
        {
            _prestadorRepository = prestadorRepository;
            _mapper = mapper;
            _logger = logger;
            _cryptographyService = cryptographyService;
            _certificadoRepository = certificadoRepository;
            _fileStorage = fileStorage;
            _storageSettings = storageSettings;
        }

        public async Task<IEnumerable<PrestadorDto>> ObterTodosAsync()
        {
            var prestadores = await _prestadorRepository.ObterTodosComRelacoesAsync();

            return prestadores.Select(MapearPrestador);
        }

        public async Task<PrestadorDto?> ObterPorIdAsync(Guid id)
        {
            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(id);

            return prestador == null ? null : MapearPrestador(prestador);
        }

        public async Task<PrestadorDto?> ObterPorCnpjAsync(string cnpj)
        {
            var prestador = await _prestadorRepository.ObterPorCnpjAsync(cnpj);

            return prestador == null ? null : MapearPrestador(prestador);
        }

        public async Task<PrestadorDto> CriarAsync(
            CreatePrestadorDto dto,
            Guid usuarioId
        )
        {
            var endereco = new API_NFSe.Domain.ValueObjects.Endereco(
                dto.Endereco.Logradouro,
                dto.Endereco.Numero,
                dto.Endereco.Complemento,
                dto.Endereco.Bairro,
                dto.Endereco.CodigoMunicipioIbge,
                dto.Endereco.Uf,
                dto.Endereco.Cep);

            var prestador = new Prestador(
                dto.Cnpj,
                dto.RazaoSocial,
                dto.NomeFantasia,
                dto.InscricaoMunicipal,
                dto.InscricaoEstadual,
                dto.Cnae,
                dto.TipoEmissao,
                dto.CodigoMunicipioIbge,
                dto.OptanteSimplesNacional,
                dto.RegimeEspecialTributario,
                dto.Telefone,
                dto.Email,
                dto.Website,
                endereco,
                usuarioId);

            await _prestadorRepository.AdicionarAsync(prestador);
            await _prestadorRepository.SaveChangesAsync();

            return MapearPrestador(prestador);
        }

        public async Task<PrestadorDto?> AtualizarAsync(
            Guid id,
            UpdatePrestadorDto dto,
            Guid usuarioId
        )
        {
            var prestador = await _prestadorRepository.ObterPorIdAsync(id);
            if (prestador == null)
            {
                return null;
            }

            var endereco = new API_NFSe.Domain.ValueObjects.Endereco(
                dto.Endereco.Logradouro,
                dto.Endereco.Numero,
                dto.Endereco.Complemento,
                dto.Endereco.Bairro,
                dto.Endereco.CodigoMunicipioIbge,
                dto.Endereco.Uf,
                dto.Endereco.Cep);

            prestador.AtualizarDadosCadastrais(
                dto.Cnpj,
                dto.RazaoSocial,
                dto.NomeFantasia,
                dto.InscricaoMunicipal,
                dto.InscricaoEstadual,
                dto.Cnae,
                dto.TipoEmissao,
                dto.CodigoMunicipioIbge,
                dto.OptanteSimplesNacional,
                dto.RegimeEspecialTributario,
                dto.Telefone,
                dto.Email,
                dto.Website,
                endereco,
                usuarioId);

            _prestadorRepository.Atualizar(prestador);
            await _prestadorRepository.SaveChangesAsync();

            return MapearPrestador(prestador);
        }

        public async Task<bool> RemoverAsync(Guid id, Guid usuarioId)
        {
            var prestador = await _prestadorRepository.ObterPorIdAsync(id);
            if (prestador == null)
            {
                return false;
            }

            prestador.DefinirAtualizadoPor(usuarioId);
            _prestadorRepository.Remover(id);
            return await _prestadorRepository.SaveChangesAsync() > 0;
        }

        public async Task<PrestadorConfiguracaoDto?> ObterConfiguracaoAsync(Guid prestadorId)
        {
            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador?.Configuracao == null)
            {
                return null;
            }

            var dto = _mapper.Map<PrestadorConfiguracaoDto>(prestador.Configuracao);
            dto.HasSmtpPassword = !string.IsNullOrWhiteSpace(prestador.Configuracao.SmtpPasswordEncrypted);
            return dto;
        }

        public async Task<PrestadorConfiguracaoDto> DefinirConfiguracaoAsync(
            Guid prestadorId,
            UpsertPrestadorConfiguracaoDto dto,
            Guid usuarioId
        )
        {
            return await PersistirConfiguracaoAsync(
                prestadorId,
                async prestador =>
                {
                    if (prestador.Configuracao == null)
                    {
                        var versaoAplicacao = dto.VersaoAplicacao?.Trim();
                        if (string.IsNullOrWhiteSpace(versaoAplicacao))
                        {
                            throw new ArgumentException("Versão da aplicação é obrigatória para criar a configuração.", nameof(dto.VersaoAplicacao));
                        }

                        var seriePadrao = dto.SeriePadrao?.Trim();
                        if (string.IsNullOrWhiteSpace(seriePadrao))
                        {
                            throw new ArgumentException("Série padrão é obrigatória para criar a configuração.", nameof(dto.SeriePadrao));
                        }

                        if (!dto.NumeroAtual.HasValue)
                        {
                            throw new ArgumentException("Número atual é obrigatório para criar a configuração.", nameof(dto.NumeroAtual));
                        }

                        var configuracao = new PrestadorConfiguracao(
                            prestadorId,
                            dto.Ambiente,
                            versaoAplicacao,
                            seriePadrao,
                            dto.NumeroAtual.Value,
                            dto.UrlEnvio,
                            dto.UrlConsulta,
                            dto.EnviaEmailAutomatico ?? false,
                            usuarioId,
                            dto.SmtpHost,
                            dto.SmtpPort,
                            dto.SmtpSecure ?? false,
                            dto.SmtpUser,
                            string.IsNullOrWhiteSpace(dto.SmtpPassword) ? null : CriptografarSenha(dto.SmtpPassword),
                            dto.SmtpFrom,
                            dto.SmtpFromName,
                            dto.SmtpResetPasswordUrl
                        );

                        configuracao.AtribuirPrestador(prestador);
                        prestador.DefinirConfiguracao(configuracao);
                        await _prestadorRepository.AdicionarConfiguracaoAsync(configuracao);
                    }
                    else
                    {
                        var configuracao = prestador.Configuracao;

                        var versaoAplicacao = dto.VersaoAplicacao is null
                            ? configuracao.VersaoAplicacao
                            : string.IsNullOrWhiteSpace(dto.VersaoAplicacao) ? configuracao.VersaoAplicacao : dto.VersaoAplicacao.Trim();

                        var seriePadrao = dto.SeriePadrao is null
                            ? configuracao.SeriePadrao
                            : string.IsNullOrWhiteSpace(dto.SeriePadrao) ? configuracao.SeriePadrao : dto.SeriePadrao.Trim();

                        var numeroAtual = dto.NumeroAtual ?? configuracao.NumeroAtual;
                        var urlEnvio = dto.UrlEnvio ?? configuracao.UrlEnvio;
                        var urlConsulta = dto.UrlConsulta ?? configuracao.UrlConsulta;
                        var enviaEmailAutomatico = dto.EnviaEmailAutomatico ?? configuracao.EnviaEmailAutomatico;
                        var smtpHost = dto.SmtpHost is null
                            ? configuracao.SmtpHost
                            : string.IsNullOrWhiteSpace(dto.SmtpHost) ? configuracao.SmtpHost : dto.SmtpHost.Trim();
                        var smtpPort = dto.SmtpPort ?? configuracao.SmtpPort;
                        var smtpSecure = dto.SmtpSecure ?? configuracao.SmtpSecure;
                        var smtpUser = dto.SmtpUser is null
                            ? configuracao.SmtpUser
                            : string.IsNullOrWhiteSpace(dto.SmtpUser) ? configuracao.SmtpUser : dto.SmtpUser.Trim();

                        var smtpFrom = dto.SmtpFrom is null
                            ? configuracao.SmtpFrom
                            : string.IsNullOrWhiteSpace(dto.SmtpFrom) ? configuracao.SmtpFrom : dto.SmtpFrom.Trim();

                        var smtpFromName = dto.SmtpFromName is null
                            ? configuracao.SmtpFromName
                            : string.IsNullOrWhiteSpace(dto.SmtpFromName) ? configuracao.SmtpFromName : dto.SmtpFromName.Trim();

                        var smtpResetPasswordUrl = dto.SmtpResetPasswordUrl is null
                            ? configuracao.SmtpResetPasswordUrl
                            : string.IsNullOrWhiteSpace(dto.SmtpResetPasswordUrl) ? configuracao.SmtpResetPasswordUrl : dto.SmtpResetPasswordUrl.Trim();

                        prestador.Configuracao.Atualizar(
                            dto.Ambiente,
                            versaoAplicacao,
                            seriePadrao,
                            numeroAtual,
                            urlEnvio,
                            urlConsulta,
                            enviaEmailAutomatico,
                            usuarioId,
                            smtpHost,
                            smtpPort,
                            smtpSecure,
                            smtpUser,
                            string.IsNullOrWhiteSpace(dto.SmtpPassword) ? null : CriptografarSenha(dto.SmtpPassword),
                            smtpFrom,
                            smtpFromName,
                            smtpResetPasswordUrl
                        );
                    }
                }
            );
        }

        private async Task<PrestadorConfiguracaoDto> PersistirConfiguracaoAsync(
            Guid prestadorId,
            Func<Prestador, Task> aplicarAlteracoes
        )
        {
            const int tentativasMaximas = 3;

            for (var tentativa = 1; tentativa <= tentativasMaximas; tentativa++)
            {
                _logger.LogInformation(
                    "Atualizando configuração do prestador {PrestadorId}. Tentativa {Tentativa} de {TotalTentativas}.",
                    prestadorId,
                    tentativa,
                    tentativasMaximas
                );

                var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
                if (prestador == null)
                {
                    _logger.LogWarning(
                        "Prestador {PrestadorId} não encontrado ao salvar configuração.",
                        prestadorId
                    );
                    throw new InvalidOperationException("Prestador não encontrado.");
                }

                await aplicarAlteracoes(prestador);

                try
                {
                    var linhas = await _prestadorRepository.SaveChangesAsync();

                    if (linhas == 0)
                    {
                        _logger.LogWarning(
                            "Nenhuma linha afetada ao salvar configuração do prestador {PrestadorId} na tentativa {Tentativa}.",
                            prestadorId,
                            tentativa
                        );
                    }
                    else
                    {
                        _logger.LogInformation(
                            "Configuração do prestador {PrestadorId} salva com sucesso (linhas afetadas: {Linhas}).",
                            prestadorId,
                            linhas
                        );
                    }

                    var configuracao = prestador.Configuracao!;

                    var dto = _mapper.Map<PrestadorConfiguracaoDto>(configuracao);
                    dto.HasSmtpPassword = !string.IsNullOrWhiteSpace(configuracao.SmtpPasswordEncrypted);

                    return dto;
                }
                catch (DbUpdateConcurrencyException ex) when (tentativa < tentativasMaximas)
                {
                    _logger.LogWarning(
                        ex,
                        "Conflito de concorrência ao salvar configuração do prestador {PrestadorId} na tentativa {Tentativa}. Recarregando entidade...",
                        prestadorId,
                        tentativa
                    );

                    foreach (var entry in ex.Entries)
                    {
                        entry.State = EntityState.Detached;
                    }
                }
            }

            _logger.LogError(
                "Falha ao salvar configuração do prestador {PrestadorId} após {Tentativas} tentativas.",
                prestadorId,
                tentativasMaximas
            );

            throw new InvalidOperationException(
                "Não foi possível salvar a configuração do prestador devido a conflito de concorrência."
            );
        }

        private string CriptografarSenha(string? senha)
        {
            if (string.IsNullOrWhiteSpace(senha))
            {
                return string.Empty;
            }

            return _cryptographyService.Encrypt(senha);
        }

        private PrestadorDto MapearPrestador(Prestador prestador)
        {
            var dto = _mapper.Map<PrestadorDto>(prestador);

            if (dto.Configuracao != null)
            {
                dto.Configuracao.HasSmtpPassword = !string.IsNullOrWhiteSpace(prestador.Configuracao?.SmtpPasswordEncrypted);
            }

            return dto;
        }

        public async Task<IEnumerable<PrestadorCertificadoDto>> ListarCertificadosAsync(Guid prestadorId, CancellationToken cancellationToken = default)
        {
            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador is null)
            {
                throw new InvalidOperationException("Prestador não encontrado.");
            }

            return prestador.Certificados
                .Where(c => c.Ativo)
                .OrderBy(c => c.Alias, StringComparer.OrdinalIgnoreCase)
                .Select(MapearCertificado)
                .ToArray();
        }

        public async Task<PrestadorCertificadoDto> UploadCertificadoAsync(Guid prestadorId, PrestadorCertificadoUploadDto dto, Guid usuarioId, CancellationToken cancellationToken = default)
        {
            if (dto is null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador is null)
            {
                throw new InvalidOperationException("Prestador não encontrado.");
            }

            if (dto.Conteudo is null || dto.Conteudo.Length == 0)
            {
                throw new ArgumentException("O arquivo do certificado é obrigatório.", nameof(dto.Conteudo));
            }

            X509Certificate2 certificado;
            try
            {
                certificado = new X509Certificate2(
                    dto.Conteudo,
                    dto.Senha,
                    X509KeyStorageFlags.Exportable | X509KeyStorageFlags.EphemeralKeySet);
            }
            catch (CryptographicException ex)
            {
                throw new InvalidOperationException("Não foi possível abrir o certificado. Verifique a senha informada.", ex);
            }

            if (!certificado.HasPrivateKey)
            {
                throw new InvalidOperationException("O certificado informado não possui chave privada.");
            }

            var prestadorCnpj = SomenteDigitos(prestador.Cnpj);
            var certificadoCnpj = ExtrairCnpjCertificado(certificado);
            if (!string.Equals(prestadorCnpj, certificadoCnpj, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("O certificado informado não pertence ao prestador.");
            }

            var thumbprint = certificado.Thumbprint?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(thumbprint))
            {
                throw new InvalidOperationException("Não foi possível determinar o thumbprint do certificado.");
            }

            var alias = string.IsNullOrWhiteSpace(dto.Alias)
                ? certificado.GetNameInfo(X509NameType.SimpleName, false) ?? thumbprint
                : dto.Alias.Trim();

            var fileName = thumbprint + ".pfx";
            var relativePath = _fileStorage.BuildRelativePath(prestadorCnpj, fileName);

            await _fileStorage.SaveAsync(relativePath, dto.Conteudo, cancellationToken);

            var hashConteudo = _cryptographyService.ComputeSha256(Convert.ToBase64String(dto.Conteudo));
            var senhaProtegida = string.IsNullOrWhiteSpace(dto.Senha)
                ? null
                : _cryptographyService.Encrypt(dto.Senha);

            var existente = await _certificadoRepository.ObterPorThumbprintAsync(thumbprint);
            var dataEnvio = DateTime.UtcNow;

            if (existente is null)
            {
                var novoCertificado = new PrestadorCertificado(
                    prestadorId,
                    alias,
                    relativePath,
                    hashConteudo,
                    dto.Conteudo.LongLength,
                    senhaProtegida,
                    certificado.NotBefore.ToUniversalTime(),
                    certificado.NotAfter.ToUniversalTime(),
                    thumbprint,
                    certificado.GetNameInfo(X509NameType.SimpleName, false) ?? string.Empty,
                    certificado.Subject,
                    certificado.Issuer,
                    certificadoCnpj,
                    usuarioId,
                    dataEnvio);

                prestador.Certificados.Add(novoCertificado);
                await _prestadorRepository.SaveChangesAsync();
                return MapearCertificado(novoCertificado);
            }

            if (existente.PrestadorId != prestadorId)
            {
                throw new InvalidOperationException("O certificado informado já está vinculado a outro prestador.");
            }

            existente.AtualizarAlias(alias, usuarioId);
            existente.AtualizarArquivo(
                relativePath,
                hashConteudo,
                dto.Conteudo.LongLength,
                certificado.NotBefore.ToUniversalTime(),
                certificado.NotAfter.ToUniversalTime(),
                thumbprint,
                certificado.GetNameInfo(X509NameType.SimpleName, false) ?? string.Empty,
                certificado.Subject,
                certificado.Issuer,
                certificadoCnpj,
                dataEnvio,
                usuarioId);

            if (!string.IsNullOrWhiteSpace(senhaProtegida))
            {
                existente.AtualizarSenha(senhaProtegida, usuarioId);
            }

            _certificadoRepository.Atualizar(existente);
            await _prestadorRepository.SaveChangesAsync();

            return MapearCertificado(existente);
        }

        public async Task<PrestadorCertificadoDto?> AtualizarCertificadoAsync(Guid prestadorId, Guid certificadoId, PrestadorCertificadoUpdateDto dto, Guid usuarioId, CancellationToken cancellationToken = default)
        {
            if (dto is null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            var certificado = await BuscarCertificadoDoPrestador(prestadorId, certificadoId);
            if (certificado is null)
            {
                return null;
            }

            certificado.AtualizarAlias(dto.Alias, usuarioId);
            _certificadoRepository.Atualizar(certificado);
            await _prestadorRepository.SaveChangesAsync();

            return MapearCertificado(certificado);
        }

        public async Task AtualizarSenhaCertificadoAsync(Guid prestadorId, Guid certificadoId, PrestadorCertificadoSenhaDto dto, Guid usuarioId, CancellationToken cancellationToken = default)
        {
            if (dto is null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            var certificado = await BuscarCertificadoDoPrestador(prestadorId, certificadoId)
                ?? throw new InvalidOperationException("Certificado não encontrado.");

            var senhaProtegida = string.IsNullOrWhiteSpace(dto.Senha)
                ? null
                : _cryptographyService.Encrypt(dto.Senha);

            certificado.AtualizarSenha(senhaProtegida, usuarioId);
            _certificadoRepository.Atualizar(certificado);
            await _prestadorRepository.SaveChangesAsync();
        }

        public async Task RemoverCertificadoAsync(Guid prestadorId, Guid certificadoId, Guid usuarioId, CancellationToken cancellationToken = default)
        {
            var certificado = await BuscarCertificadoDoPrestador(prestadorId, certificadoId)
                ?? throw new InvalidOperationException("Certificado não encontrado.");

            certificado.Desativar();
            certificado.AtualizarSenha(null, usuarioId);
            _certificadoRepository.Atualizar(certificado);
            await _prestadorRepository.SaveChangesAsync();

            await _fileStorage.DeleteAsync(certificado.CaminhoRelativo, cancellationToken);
        }

        private async Task<PrestadorCertificado?> BuscarCertificadoDoPrestador(Guid prestadorId, Guid certificadoId)
        {
            var certificado = await _certificadoRepository.ObterPorIdAsync(certificadoId);
            if (certificado is null || certificado.PrestadorId != prestadorId)
            {
                return null;
            }

            return certificado;
        }

        private static string SomenteDigitos(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                return string.Empty;
            }

            var buffer = new char[valor.Length];
            var index = 0;
            foreach (var caractere in valor)
            {
                if (char.IsDigit(caractere))
                {
                    buffer[index++] = caractere;
                }
            }

            return index == 0 ? string.Empty : new string(buffer, 0, index);
        }

        private static string ExtrairCnpjCertificado(X509Certificate2 certificado)
        {
            var texto = certificado.Subject + " " + certificado.Issuer;
            if (string.IsNullOrWhiteSpace(texto))
            {
                return string.Empty;
            }

            var match = Regex.Match(texto, @"(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{14})");
            if (!match.Success)
            {
                return string.Empty;
            }

            return SomenteDigitos(match.Value);
        }

        private static PrestadorCertificadoDto MapearCertificado(PrestadorCertificado certificado)
        {
            return new PrestadorCertificadoDto
            {
                Id = certificado.Id,
                Alias = certificado.Alias,
                Thumbprint = certificado.Thumbprint,
                CommonName = certificado.CommonName,
                Cnpj = certificado.Cnpj,
                NotBefore = certificado.NotBefore,
                NotAfter = certificado.NotAfter,
                DataEnvio = certificado.DataEnvio,
                TamanhoBytes = certificado.TamanhoBytes
            };
        }
    }
}
