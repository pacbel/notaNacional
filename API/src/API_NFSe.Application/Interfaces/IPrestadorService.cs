using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Prestadores;

namespace API_NFSe.Application.Interfaces
{
    public interface IPrestadorService
    {
        Task<IEnumerable<PrestadorDto>> ObterTodosAsync();
        Task<PrestadorDto?> ObterPorIdAsync(Guid id);
        Task<PrestadorDto?> ObterPorCnpjAsync(string cnpj);
        Task<PrestadorDto> CriarAsync(CreatePrestadorDto dto, Guid usuarioId);
        Task<PrestadorDto?> AtualizarAsync(Guid id, UpdatePrestadorDto dto, Guid usuarioId);
        Task<bool> RemoverAsync(Guid id, Guid usuarioId);
        Task<PrestadorConfiguracaoDto?> ObterConfiguracaoAsync(Guid prestadorId);
        Task<PrestadorConfiguracaoDto> DefinirConfiguracaoAsync(Guid prestadorId, UpsertPrestadorConfiguracaoDto dto, Guid usuarioId);
    }
}
