using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Dps;

namespace API_NFSe.Application.Interfaces
{
    public interface IDpsService
    {
        Task<DpsDto> CriarAsync(string usuarioReferencia, Guid prestadorId, Guid usuarioId, CriarDpsRequestDto request);
        Task<DpsDto?> ObterPorIdAsync(string usuarioReferencia, Guid prestadorId, Guid dpsId);
        Task<IEnumerable<DpsDto>> ObterTodosAsync(string usuarioReferencia, Guid prestadorId, string? status = null, DateTimeOffset? dataInicio = null, DateTimeOffset? dataFim = null);
    }
}
