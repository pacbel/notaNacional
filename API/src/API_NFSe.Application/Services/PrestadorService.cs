using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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

        public PrestadorService(
            IPrestadorRepository prestadorRepository,
            IMapper mapper,
            ILogger<PrestadorService> logger,
            ICryptographyService cryptographyService
        )
        {
            _prestadorRepository = prestadorRepository;
            _mapper = mapper;
            _logger = logger;
            _cryptographyService = cryptographyService;
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
    }
}
