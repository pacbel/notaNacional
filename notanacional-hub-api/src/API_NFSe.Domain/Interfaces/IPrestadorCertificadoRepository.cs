using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces;

public interface IPrestadorCertificadoRepository : IRepositoryBase<PrestadorCertificado>
{
    Task<PrestadorCertificado?> ObterPorThumbprintAsync(string thumbprint);
    Task<IEnumerable<PrestadorCertificado>> ObterPorPrestadorAsync(Guid prestadorId);
    Task<IEnumerable<PrestadorCertificado>> ObterTodosAtivosAsync();
}
