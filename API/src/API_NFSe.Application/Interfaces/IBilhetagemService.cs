using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Bilhetagem;

namespace API_NFSe.Application.Interfaces
{
    public interface IBilhetagemService
    {
        Task<BilhetagemSaldoDto> ObterSaldoAsync(Guid prestadorId, CancellationToken cancellationToken = default);
        Task<IEnumerable<BilhetagemLancamentoDto>> ObterLancamentosAsync(Guid prestadorId, int limite = 50, CancellationToken cancellationToken = default);
        Task<BilhetagemSaldoDto> AdicionarCreditosAsync(Guid prestadorId, int quantidade, Guid usuarioId, string? observacao, CancellationToken cancellationToken = default);
        Task<BilhetagemReservaToken?> ReservarCreditoParaEmissaoAsync(Guid prestadorId, Guid usuarioId, CancellationToken cancellationToken = default);
        Task ConfirmarEmissaoAutorizadaAsync(BilhetagemReservaToken reserva, string? chaveAcesso, string? usuarioReferencia, CancellationToken cancellationToken = default);
        Task CancelarReservaAsync(BilhetagemReservaToken? reserva, CancellationToken cancellationToken = default);
    }
}
