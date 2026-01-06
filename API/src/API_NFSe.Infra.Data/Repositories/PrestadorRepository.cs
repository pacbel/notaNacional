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
    public class PrestadorRepository : RepositoryBase<Prestador>, IPrestadorRepository
    {
        public PrestadorRepository(ApiContext context)
            : base(context)
        {
        }

        public async Task<Prestador?> ObterPorCnpjAsync(string cnpj)
        {
            if (string.IsNullOrWhiteSpace(cnpj))
            {
                return null;
            }

            return await _dbSet
                .Include(p => p.Configuracao)
                .Include(p => p.Certificados)
                .Include(p => p.Usuarios)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Cnpj == cnpj && p.Ativo);
        }

        public async Task<IEnumerable<Prestador>> ObterPorUsuarioAsync(Guid usuarioId)
        {
            return await _dbSet
                .Include(p => p.Configuracao)
                .Include(p => p.Certificados)
                .Include(p => p.Usuarios)
                .Where(p => p.Ativo && (p.CriadoPorUsuarioId == usuarioId || p.AtualizadoPorUsuarioId == usuarioId))
                .AsNoTracking()
                .OrderBy(p => p.RazaoSocial)
                .ToListAsync();
        }

        public async Task<IEnumerable<Prestador>> ObterTodosComRelacoesAsync()
        {
            return await _dbSet
                .Include(p => p.Configuracao)
                .Include(p => p.Certificados)
                .Include(p => p.Usuarios)
                .AsNoTracking()
                .Where(p => p.Ativo)
                .OrderBy(p => p.RazaoSocial)
                .ToListAsync();
        }

        public async Task<Prestador?> ObterPorIdComRelacoesAsync(Guid id)
        {
            return await _dbSet
                .Include(p => p.Configuracao)
                .Include(p => p.Certificados)
                .Include(p => p.Usuarios)
                .FirstOrDefaultAsync(p => p.Id == id && p.Ativo);
        }

        public async Task AdicionarConfiguracaoAsync(PrestadorConfiguracao configuracao)
        {
            configuracao.AtribuirPrestador(configuracao.Prestador);
            _context.Entry(configuracao).State = EntityState.Added;
            await _context.Set<PrestadorConfiguracao>().AddAsync(configuracao);
        }
    }
}
