using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.RobotClients;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using System.Security.Cryptography;
using BCrypt.Net;
using Microsoft.Extensions.Logging;

namespace API_NFSe.Application.Services
{
    public class RobotClientService : IRobotClientService
    {
        private readonly IRobotClientRepository _robotClientRepository;
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly ILogger<RobotClientService> _logger;

        public RobotClientService(
            IRobotClientRepository robotClientRepository,
            IPrestadorRepository prestadorRepository,
            ILogger<RobotClientService> logger
        )
        {
            _robotClientRepository = robotClientRepository;
            _prestadorRepository = prestadorRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<RobotClientDto>> ObterTodosAsync(Guid prestadorId, bool incluirInativos = false)
        {
            var prestador = await ObterPrestadorOuFalharAsync(prestadorId);

            var clientes = await _robotClientRepository.ObterTodosAsync(prestadorId, incluirInativos);
            return clientes.Select(cliente => MapearParaDto(cliente));
        }

        public async Task<RobotClientDto?> ObterPorIdAsync(Guid prestadorId, Guid id)
        {
            var prestador = await ObterPrestadorOuFalharAsync(prestadorId);

            var cliente = await _robotClientRepository.ObterPorIdComPrestadorAsync(id);
            if (cliente == null || cliente.PrestadorId != prestadorId)
            {
                return null;
            }

            return MapearParaDto(cliente);
        }

        public async Task<RobotClientDto> CriarAsync(Guid prestadorId, CreateRobotClientDto dto)
        {
            var prestador = await ObterPrestadorOuFalharAsync(prestadorId);

            var clientId = await ObterOuGerarClientIdAsync(prestadorId, dto);
            var secretPlano = ObterOuGerarSecret(dto);
            var secretHash = BCrypt.Net.BCrypt.HashPassword(secretPlano);
            var scopesNormalizados = NormalizarScopes(dto.Scopes);

            var cliente = new RobotClient(dto.Nome, clientId, secretHash, prestadorId, scopesNormalizados);

            await _robotClientRepository.AdicionarAsync(cliente);
            await _robotClientRepository.SaveChangesAsync();

            var clienteCriado = await _robotClientRepository.ObterPorIdComPrestadorAsync(cliente.Id)
                                ?? throw new InvalidOperationException("Não foi possível carregar o cliente robótico recém-criado.");

            return MapearParaDto(clienteCriado, secretPlano);
        }

        public async Task<RobotClientDto?> AtualizarAsync(Guid prestadorId, Guid id, UpdateRobotClientDto dto)
        {
            var prestador = await ObterPrestadorOuFalharAsync(prestadorId);

            var cliente = await _robotClientRepository.ObterPorIdComPrestadorAsync(id);
            if (cliente == null || cliente.PrestadorId != prestadorId)
            {
                return null;
            }

            var clientIdDisponivel = await _robotClientRepository.ClientIdDisponivelAsync(dto.ClientId, id);
            if (!clientIdDisponivel)
            {
                throw new InvalidOperationException("ClientId já está em uso.");
            }

            cliente.AtualizarNome(dto.Nome);
            cliente.DefinirClientId(dto.ClientId);
            cliente.DefinirScopes(NormalizarScopes(dto.Scopes));

            if (dto.Ativo && !cliente.Ativo)
            {
                cliente.Reativar();
            }
            else if (!dto.Ativo && cliente.Ativo)
            {
                cliente.Inativar();
            }

            _robotClientRepository.Atualizar(cliente);
            await _robotClientRepository.SaveChangesAsync();

            var clienteAtualizado = await _robotClientRepository.ObterPorIdComPrestadorAsync(cliente.Id)
                                   ?? throw new InvalidOperationException("Não foi possível carregar o cliente robótico atualizado.");

            return MapearParaDto(clienteAtualizado);
        }

        public async Task<bool> InativarAsync(Guid prestadorId, Guid id)
        {
            var cliente = await ObterClienteDoPrestadorAsync(prestadorId, id);
            if (cliente == null)
            {
                _logger.LogWarning("Robô {RobotId} não encontrado para inativação (prestador {PrestadorId}).", id, prestadorId);
                return false;
            }

            if (!cliente.Ativo)
            {
                _logger.LogWarning("Robô {RobotId} já está inativo (prestador {PrestadorId}).", id, prestadorId);
                return false;
            }

            cliente.Inativar();
            _robotClientRepository.Atualizar(cliente);
            return await _robotClientRepository.SaveChangesAsync() > 0;
        }

        public async Task<bool> ReativarAsync(Guid prestadorId, Guid id)
        {
            var cliente = await ObterClienteDoPrestadorAsync(prestadorId, id);
            if (cliente == null)
            {
                _logger.LogWarning("Robô {RobotId} não encontrado para reativação (prestador {PrestadorId}).", id, prestadorId);
                return false;
            }

            if (cliente.Ativo)
            {
                _logger.LogInformation("Robô {RobotId} já está ativo (prestador {PrestadorId}).", id, prestadorId);
                return false;
            }

            cliente.Reativar();
            _robotClientRepository.Atualizar(cliente);
            var linhas = await _robotClientRepository.SaveChangesAsync();

            if (linhas == 0)
            {
                _logger.LogWarning(
                    "Nenhuma linha afetada ao reativar robô {RobotId} (prestador {PrestadorId}).",
                    id,
                    prestadorId
                );
                return false;
            }

            _logger.LogInformation(
                "Robô {RobotId} reativado com sucesso (prestador {PrestadorId}). Linhas afetadas: {Linhas}.",
                id,
                prestadorId,
                linhas
            );

            return true;
        }

        public async Task<bool> RotacionarSecretAsync(Guid prestadorId, Guid id, string novoSecret)
        {
            if (string.IsNullOrWhiteSpace(novoSecret))
            {
                throw new ArgumentException("O novo secret não pode ser vazio.", nameof(novoSecret));
            }

            var cliente = await ObterClienteDoPrestadorAsync(prestadorId, id);
            if (cliente == null)
            {
                return false;
            }

            var secretHash = BCrypt.Net.BCrypt.HashPassword(novoSecret);
            cliente.RedefinirSecretHash(secretHash);
            _robotClientRepository.Atualizar(cliente);
            return await _robotClientRepository.SaveChangesAsync() > 0;
        }

        private async Task<Prestador> ObterPrestadorOuFalharAsync(Guid prestadorId)
        {
            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            var prestador = await _prestadorRepository.ObterPorIdAsync(prestadorId);
            if (prestador == null)
            {
                throw new InvalidOperationException("Prestador não encontrado ou inativo.");
            }

            return prestador;
        }

        private async Task<RobotClient?> ObterClienteDoPrestadorAsync(Guid prestadorId, Guid id)
        {
            if (prestadorId == Guid.Empty || id == Guid.Empty)
            {
                return null;
            }

            var cliente = await _robotClientRepository.ObterPorIdComPrestadorAsync(id);
            if (cliente == null || cliente.PrestadorId != prestadorId)
            {
                return null;
            }

            return cliente;
        }

        private static RobotClientDto MapearParaDto(RobotClient cliente, string? secretGerado = null)
        {
            return new RobotClientDto
            {
                Id = cliente.Id,
                Nome = cliente.Nome,
                ClientId = cliente.ClientId,
                Role = cliente.Role,
                PrestadorId = cliente.PrestadorId,
                PrestadorNome = cliente.Prestador?.NomeFantasia ?? string.Empty,
                PrestadorCnpj = cliente.Prestador?.Cnpj ?? string.Empty,
                Scopes = ParseScopes(cliente.Scopes),
                Ativo = cliente.Ativo,
                DataCriacao = cliente.DataCriacao,
                DataAtualizacao = cliente.DataAtualizacao,
                SecretGerado = secretGerado
            };
        }

        private async Task<string> ObterOuGerarClientIdAsync(Guid prestadorId, CreateRobotClientDto dto)
        {
            var clientIdInformado = dto.ClientId?.Trim();
            var gerarAutomatico = dto.GerarClientIdAutomatico || string.IsNullOrWhiteSpace(clientIdInformado);

            if (!gerarAutomatico)
            {
                if (clientIdInformado!.Length > 80)
                {
                    throw new ArgumentException("ClientId deve ter no máximo 80 caracteres.", nameof(dto.ClientId));
                }

                var disponivel = await _robotClientRepository.ClientIdDisponivelAsync(clientIdInformado);
                if (!disponivel)
                {
                    throw new InvalidOperationException("ClientId já está em uso.");
                }

                return clientIdInformado;
            }

            const int maxTentativas = 5;
            for (var tentativa = 0; tentativa < maxTentativas; tentativa++)
            {
                var candidato = GerarClientIdAutomatico(prestadorId);
                var disponivel = await _robotClientRepository.ClientIdDisponivelAsync(candidato);
                if (disponivel)
                {
                    return candidato;
                }
            }

            throw new InvalidOperationException("Não foi possível gerar um clientId único automaticamente. Tente novamente.");
        }

        private static string ObterOuGerarSecret(CreateRobotClientDto dto)
        {
            var secretInformado = dto.Secret?.Trim();
            var gerarAutomatico = dto.GerarSecretAutomatico || string.IsNullOrWhiteSpace(secretInformado);

            if (!gerarAutomatico)
            {
                if (string.IsNullOrWhiteSpace(secretInformado))
                {
                    throw new ArgumentException("Secret deve ser informado quando a geração automática estiver desabilitada.", nameof(dto.Secret));
                }

                if (secretInformado!.Length < 16 || secretInformado.Length > 256)
                {
                    throw new ArgumentException("Secret deve ter entre 16 e 256 caracteres.", nameof(dto.Secret));
                }

                return secretInformado;
            }

            return GerarSecretSeguro();
        }

        private static string GerarClientIdAutomatico(Guid prestadorId)
        {
            var prefixo = prestadorId.ToString("N").Substring(0, 6);
            return $"rc-{prefixo}-{Guid.NewGuid():N}";
        }

        private static string GerarSecretSeguro(int tamanhoBytes = 32)
        {
            var buffer = new byte[tamanhoBytes];
            RandomNumberGenerator.Fill(buffer);
            return Convert.ToBase64String(buffer);
        }

        private static string NormalizarScopes(IEnumerable<string> scopes)
        {
            if (scopes == null)
            {
                return string.Empty;
            }

            var valores = scopes
                .Where(scope => !string.IsNullOrWhiteSpace(scope))
                .Select(scope => scope.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(scope => scope, StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return valores.Length == 0 ? string.Empty : string.Join(' ', valores);
        }

        private static IList<string> ParseScopes(string? scopes)
        {
            if (string.IsNullOrWhiteSpace(scopes))
            {
                return new List<string>();
            }

            return scopes
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(scope => scope, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
