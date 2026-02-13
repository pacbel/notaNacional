using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IUsuarioRepository : IRepositoryBase<Usuario>
    {
        Task<Usuario?> ObterPorEmailHashAsync(string emailHash);
        Task<Usuario?> ObterPorResetTokenAsync(string token);
        Task<Usuario?> ObterPorRefreshTokenAsync(string refreshToken);
        Task<IEnumerable<Usuario>> ObterPorPrestadorAsync(Guid prestadorId);
    }
}
