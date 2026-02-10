using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Repositories;

public class PrestadorCertificadoRepository : RepositoryBase<PrestadorCertificado>, IPrestadorCertificadoRepository
{
    public PrestadorCertificadoRepository(ApiContext context) : base(context)
    {
    }

    public async Task<PrestadorCertificado?> ObterPorThumbprintAsync(string thumbprint)
    {
        if (string.IsNullOrWhiteSpace(thumbprint))
        {
            return null;
        }

        return await _dbSet.FirstOrDefaultAsync(c => c.Thumbprint == thumbprint && c.Ativo);
    }

    public async Task<IEnumerable<PrestadorCertificado>> ObterPorPrestadorAsync(Guid prestadorId)
    {
        return await _dbSet
            .Where(c => c.PrestadorId == prestadorId && c.Ativo)
            .AsNoTracking()
            .OrderBy(c => c.Alias)
            .ToListAsync();
    }

    public async Task<IEnumerable<PrestadorCertificado>> ObterTodosAtivosAsync()
    {
        return await _dbSet
            .Where(c => c.Ativo)
            .AsNoTracking()
            .ToListAsync();
    }

    public override void Remover(Guid id)
    {
        var entity = _dbSet.FirstOrDefault(c => c.Id == id);
        if (entity is null)
        {
            return;
        }

        _dbSet.Remove(entity);
    }
}
