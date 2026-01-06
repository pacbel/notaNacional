using System;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Repositories
{
    public class UsuarioRepository : RepositoryBase<Usuario>, IUsuarioRepository
    {
        public UsuarioRepository(ApiContext context)
            : base(context)
        {
        }

        public async Task<Usuario?> ObterPorEmailHashAsync(string emailHash)
        {
            if (string.IsNullOrWhiteSpace(emailHash))
            {
                return null;
            }

            return await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.EmailHash == emailHash && u.Ativo);
        }

        public async Task<Usuario?> ObterPorResetTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }

            return await _dbSet.FirstOrDefaultAsync(
                u => u.ResetToken == token && u.ResetTokenExpiraEm >= DateTime.UtcNow && u.Ativo
            );
        }

        public async Task<Usuario?> ObterPorRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return null;
            }

            return await _dbSet.FirstOrDefaultAsync(
                u => u.RefreshToken == refreshToken && u.RefreshTokenExpiraEm >= DateTime.UtcNow && u.Ativo
            );
        }
    }
}
