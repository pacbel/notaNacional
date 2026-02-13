#nullable enable
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Interfaces
{
    public interface IRepositoryBase<TEntity> : IDisposable where TEntity : EntityBase
    {
        Task<TEntity?> ObterPorIdAsync(Guid id);
        Task<IEnumerable<TEntity>> ObterTodosAsync();
        Task AdicionarAsync(TEntity entity);
        void Atualizar(TEntity entity);
        void Remover(Guid id);
        Task<int> SaveChangesAsync();
    }
}
