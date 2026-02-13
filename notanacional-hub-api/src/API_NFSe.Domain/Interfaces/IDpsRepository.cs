using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IDpsRepository : IRepositoryBase<Dps>
    {
        Task<Dps?> ObterPorIdentificadorAsync(Guid prestadorId, string identificador);
        Task<IEnumerable<Dps>> ObterTodosPorPrestadorAsync(Guid prestadorId);
        Task<IEnumerable<Dps>> ObterPorPeriodoAsync(Guid prestadorId, DateTimeOffset dataInicio, DateTimeOffset dataFim);
        Task<IEnumerable<Dps>> ObterPorStatusAsync(Guid prestadorId, string status);
        IQueryable<Dps> QueryAtivos();
    }
}
