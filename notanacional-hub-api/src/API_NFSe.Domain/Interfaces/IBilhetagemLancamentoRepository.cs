using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IBilhetagemLancamentoRepository : IRepositoryBase<BilhetagemLancamento>
    {
        Task<IEnumerable<BilhetagemLancamento>> ObterPorPrestadorAsync(Guid prestadorId, int limite = 50);
    }
}
