using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.RobotClients;

namespace API_NFSe.Application.Interfaces
{
    public interface IRobotClientService
    {
        Task<IEnumerable<RobotClientDto>> ObterTodosAsync(Guid prestadorId, bool incluirInativos = false);
        Task<RobotClientDto?> ObterPorIdAsync(Guid prestadorId, Guid id);
        Task<RobotClientDto> CriarAsync(Guid prestadorId, CreateRobotClientDto dto);
        Task<RobotClientDto?> AtualizarAsync(Guid prestadorId, Guid id, UpdateRobotClientDto dto);
        Task<bool> InativarAsync(Guid prestadorId, Guid id);
        Task<bool> ReativarAsync(Guid prestadorId, Guid id);
        Task<bool> RotacionarSecretAsync(Guid prestadorId, Guid id, string novoSecret);
    }
}
