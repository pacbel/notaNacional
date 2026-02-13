using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Repositories
{
    public class BilhetagemLancamentoRepository : RepositoryBase<BilhetagemLancamento>, IBilhetagemLancamentoRepository
    {
        public BilhetagemLancamentoRepository(ApiContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<BilhetagemLancamento>> ObterPorPrestadorAsync(Guid prestadorId, int limite = 50)
        {
            if (prestadorId == Guid.Empty)
            {
                return Array.Empty<BilhetagemLancamento>();
            }

            limite = Math.Clamp(limite, 1, 500);

            return await _dbSet
                .Where(l => l.PrestadorId == prestadorId)
                .OrderByDescending(l => l.DataCriacao)
                .Take(limite)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
