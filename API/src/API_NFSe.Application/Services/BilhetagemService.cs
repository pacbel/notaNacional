using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Bilhetagem;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace API_NFSe.Application.Services
{
    public class BilhetagemService : IBilhetagemService
    {
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly IBilhetagemLancamentoRepository _lancamentoRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<BilhetagemService> _logger;

        public BilhetagemService(
            IPrestadorRepository prestadorRepository,
            IBilhetagemLancamentoRepository lancamentoRepository,
            IMapper mapper,
            ILogger<BilhetagemService> logger)
        {
            _prestadorRepository = prestadorRepository;
            _lancamentoRepository = lancamentoRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<BilhetagemSaldoDto> ObterSaldoAsync(Guid prestadorId, CancellationToken cancellationToken = default)
        {
            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador?.Configuracao == null)
            {
                throw new InvalidOperationException("Prestador não encontrado ou sem configuração ativa.");
            }

            AtualizarCompetenciaSeNecessario(prestador.Configuracao);
            await _prestadorRepository.SaveChangesAsync();

            return MapearSaldo(prestador.Configuracao);
        }

        public async Task<IEnumerable<BilhetagemLancamentoDto>> ObterLancamentosAsync(Guid prestadorId, int limite = 50, CancellationToken cancellationToken = default)
        {
            var lancamentos = await _lancamentoRepository.ObterPorPrestadorAsync(prestadorId, limite);
            return _mapper.Map<IEnumerable<BilhetagemLancamentoDto>>(lancamentos);
        }

        public async Task<BilhetagemSaldoDto> AdicionarCreditosAsync(Guid prestadorId, int quantidade, Guid usuarioId, string? observacao, CancellationToken cancellationToken = default)
        {
            if (quantidade <= 0)
            {
                throw new InvalidOperationException("A quantidade de créditos deve ser maior que zero.");
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId) ?? throw new InvalidOperationException("Prestador não encontrado.");
            if (prestador.Configuracao == null)
            {
                throw new InvalidOperationException("Prestador não possui configuração ativa.");
            }

            AtualizarCompetenciaSeNecessario(prestador.Configuracao);

            var saldoAnterior = prestador.Configuracao.SaldoNotasDisponiveis;
            prestador.Configuracao.AdicionarCreditos(quantidade, usuarioId);
            var saldoPosterior = prestador.Configuracao.SaldoNotasDisponiveis;

            var lancamento = new BilhetagemLancamento(prestadorId, quantidade, saldoAnterior, saldoPosterior, usuarioId, observacao);
            lancamento.DefinirPrestador(prestador);
            await _lancamentoRepository.AdicionarAsync(lancamento);

            await _lancamentoRepository.SaveChangesAsync();
            return MapearSaldo(prestador.Configuracao);
        }

        public async Task<BilhetagemReservaToken?> ReservarCreditoParaEmissaoAsync(Guid prestadorId, Guid usuarioId, CancellationToken cancellationToken = default)
        {
            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId);
            if (prestador?.Configuracao == null)
            {
                return null;
            }

            AtualizarCompetenciaSeNecessario(prestador.Configuracao);

            if (!prestador.Configuracao.BilhetagemAtiva())
            {
                return null;
            }

            try
            {
                prestador.Configuracao.ReservarCredito();
                return new BilhetagemReservaToken(prestadorId, usuarioId, prestador.Configuracao.SaldoNotasDisponiveis + 1);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Saldo insuficiente para emissão de NFSe. Prestador {PrestadorId}", prestadorId);
                throw;
            }
        }

        public async Task ConfirmarEmissaoAutorizadaAsync(BilhetagemReservaToken reserva, string? chaveAcesso, string? usuarioReferencia, CancellationToken cancellationToken = default)
        {
            if (reserva == null)
            {
                return;
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(reserva.PrestadorId);
            if (prestador?.Configuracao == null)
            {
                return;
            }

            var saldoAnterior = reserva.SaldoAnterior;
            var saldoPosterior = prestador.Configuracao.SaldoNotasDisponiveis;

            var lancamento = new BilhetagemLancamento(reserva.PrestadorId, -1, saldoAnterior, saldoPosterior, reserva.UsuarioId, chaveAcesso);
            lancamento.DefinirPrestador(prestador);
            await _lancamentoRepository.AdicionarAsync(lancamento);
            await _lancamentoRepository.SaveChangesAsync();
        }

        public async Task CancelarReservaAsync(BilhetagemReservaToken? reserva, CancellationToken cancellationToken = default)
        {
            if (reserva == null)
            {
                return;
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(reserva.PrestadorId);
            if (prestador?.Configuracao == null)
            {
                return;
            }

            prestador.Configuracao.EstornarCredito();
            await _prestadorRepository.SaveChangesAsync();
        }

        private static void AtualizarCompetenciaSeNecessario(PrestadorConfiguracao configuracao)
        {
            configuracao.RenovarSaldoSeNecessario(DateTime.UtcNow);
        }

        private static BilhetagemSaldoDto MapearSaldo(PrestadorConfiguracao configuracao)
        {
            return new BilhetagemSaldoDto
            {
                BilhetagemHabilitada = configuracao.BilhetagemAtiva(),
                CreditoMensalPadrao = configuracao.CreditoMensalPadrao,
                SaldoNotasDisponiveis = configuracao.SaldoNotasDisponiveis,
                CompetenciaSaldo = configuracao.CompetenciaSaldo
            };
        }
    }
}
