using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Nfse;

namespace API_NFSe.Application.Interfaces
{
    public interface INfseSefinService
    {
        Task<IReadOnlyCollection<CertificateInfoDto>> ListarCertificadosAsync(string usuarioReferencia, Guid? prestadorId, bool listarTodosCertificados);
        Task<ListarNotasEmitidasResponseDto> ListarNotasEmitidasAsync(string usuarioReferencia, Guid prestadorId, ListarNotasEmitidasRequestDto request);
        Task<EmitirNfseResponseDto> EmitirAsync(string usuarioReferencia, Guid prestadorId, EmitirNfseRequestDto request, CancellationToken cancellationToken);
        Task<CancelarNfseResponseDto> CancelarAsync(string usuarioReferencia, Guid prestadorId, CancelarNfseRequestDto request, CancellationToken cancellationToken);
        Task<DownloadDanfseResponseDto> DownloadDanfseAsync(string usuarioReferencia, Guid prestadorId, DownloadDanfseRequestDto request, CancellationToken cancellationToken);
    }
}
