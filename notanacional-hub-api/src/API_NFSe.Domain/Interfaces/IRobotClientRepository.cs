using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IRobotClientRepository : IRepositoryBase<RobotClient>
    {
        Task<RobotClient?> ObterPorClientIdAsync(string clientId);
        Task<bool> ClientIdDisponivelAsync(string clientId, Guid? ignorarId = null);
        Task<RobotClient?> ObterPorIdComPrestadorAsync(Guid id);
        Task<IEnumerable<RobotClient>> ObterTodosAsync(Guid? prestadorId = null, bool incluirInativos = false);
    }
}
