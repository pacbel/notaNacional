using System;
using System.Collections.Generic;
using System.Threading;
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
        Task<IEnumerable<PrestadorCertificadoDto>> ListarCertificadosAsync(Guid prestadorId, CancellationToken cancellationToken = default);
        Task<PrestadorCertificadoDto> UploadCertificadoAsync(Guid prestadorId, PrestadorCertificadoUploadDto dto, Guid usuarioId, CancellationToken cancellationToken = default);
        Task<PrestadorCertificadoDto?> AtualizarCertificadoAsync(Guid prestadorId, Guid certificadoId, PrestadorCertificadoUpdateDto dto, Guid usuarioId, CancellationToken cancellationToken = default);
        Task AtualizarSenhaCertificadoAsync(Guid prestadorId, Guid certificadoId, PrestadorCertificadoSenhaDto dto, Guid usuarioId, CancellationToken cancellationToken = default);
        Task RemoverCertificadoAsync(Guid prestadorId, Guid certificadoId, Guid usuarioId, CancellationToken cancellationToken = default);
    }
}
