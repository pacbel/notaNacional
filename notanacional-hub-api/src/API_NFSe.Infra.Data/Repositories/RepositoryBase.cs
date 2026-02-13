#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Domain.Common;
using API_NFSe.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Repositories
{
    public abstract class RepositoryBase<TEntity> : IRepositoryBase<TEntity>, IDisposable where TEntity : EntityBase
    {
        protected readonly DbContext _context;
        protected readonly DbSet<TEntity> _dbSet;

        protected RepositoryBase(DbContext context)
        {
            _context = context;
            _dbSet = _context.Set<TEntity>();
        }

        public virtual async Task<TEntity?> ObterPorIdAsync(Guid id)
        {
            return await _dbSet.FirstOrDefaultAsync(entity => entity.Id == id && entity.Ativo);
        }

        public virtual async Task<IEnumerable<TEntity>> ObterTodosAsync()
        {
            return await _dbSet
                .AsNoTracking()
                .Where(entity => entity.Ativo)
                .ToListAsync() ?? Enumerable.Empty<TEntity>();
        }

        public virtual async Task AdicionarAsync(TEntity entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public virtual void Atualizar(TEntity entity)
        {
            _dbSet.Update(entity);
        }

        public virtual void Remover(Guid id)
        {
            var entity = _dbSet.FirstOrDefault(e => e.Id == id && e.Ativo);
            if (entity != null)
            {
                entity.Desativar();
                _dbSet.Update(entity);
            }
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
