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
    public class DpsRepository : RepositoryBase<Dps>, IDpsRepository
    {
        public DpsRepository(ApiContext context)
            : base(context)
        {
        }

        public async Task<Dps?> ObterPorIdentificadorAsync(Guid prestadorId, string identificador)
        {
            if (prestadorId == Guid.Empty || string.IsNullOrWhiteSpace(identificador))
            {
                return null;
            }

            return await _dbSet
                .Include(d => d.Prestador)
                .Include(d => d.Usuario)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.PrestadorId == prestadorId && d.Identificador == identificador && d.Ativo);
        }

        public async Task<IEnumerable<Dps>> ObterTodosPorPrestadorAsync(Guid prestadorId)
        {
            return await _dbSet
                .Where(d => d.PrestadorId == prestadorId && d.Ativo)
                .AsNoTracking()
                .OrderByDescending(d => d.DataCriacao)
                .ToListAsync();
        }

        public async Task<IEnumerable<Dps>> ObterPorPeriodoAsync(Guid prestadorId, DateTimeOffset dataInicio, DateTimeOffset dataFim)
        {
            return await _dbSet
                .Where(d => d.PrestadorId == prestadorId && d.Ativo && d.DataHoraEmissao >= dataInicio && d.DataHoraEmissao <= dataFim)
                .AsNoTracking()
                .OrderByDescending(d => d.DataHoraEmissao)
                .ToListAsync();
        }

        public async Task<IEnumerable<Dps>> ObterPorStatusAsync(Guid prestadorId, string status)
        {
            return await _dbSet
                .Where(d => d.PrestadorId == prestadorId && d.Ativo && d.Status == status)
                .AsNoTracking()
                .OrderByDescending(d => d.DataCriacao)
                .ToListAsync();
        }

        public IQueryable<Dps> QueryAtivos()
        {
            return _dbSet
                .Include(d => d.Prestador)
                .AsNoTracking()
                .Where(d => d.Ativo);
        }
    }
}
