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
    public class RobotClientRepository : RepositoryBase<RobotClient>, IRobotClientRepository
    {
        public RobotClientRepository(ApiContext context)
            : base(context)
        {
        }

        public async Task<RobotClient?> ObterPorClientIdAsync(string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                return null;
            }

            return await _dbSet
                .Include(rc => rc.Prestador)
                .FirstOrDefaultAsync(rc => rc.ClientId == clientId && rc.Ativo);
        }

        public async Task<bool> ClientIdDisponivelAsync(string clientId, Guid? ignorarId = null)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                return false;
            }

            return !await _dbSet.AnyAsync(rc => rc.ClientId == clientId && (!ignorarId.HasValue || rc.Id != ignorarId.Value));
        }

        public async Task<RobotClient?> ObterPorIdComPrestadorAsync(Guid id)
        {
            return await _dbSet
                .Include(rc => rc.Prestador)
                .FirstOrDefaultAsync(rc => rc.Id == id);
        }

        public async Task<IEnumerable<RobotClient>> ObterTodosAsync(Guid? prestadorId = null, bool incluirInativos = false)
        {
            var query = _dbSet
                .Include(rc => rc.Prestador)
                .AsQueryable();

            if (prestadorId.HasValue)
            {
                query = query.Where(rc => rc.PrestadorId == prestadorId.Value);
            }

            if (!incluirInativos)
            {
                query = query.Where(rc => rc.Ativo);
            }

            return await query
                .AsNoTracking()
                .OrderBy(rc => rc.Nome)
                .ToListAsync();
        }
    }
}
