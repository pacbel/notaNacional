using System;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Emails;

namespace API_NFSe.Application.Interfaces
{
    public interface IEmailEnvioService
    {
        Task EnviarAsync(Guid prestadorId, EnviarEmailRequestDto request, CancellationToken cancellationToken);
    }
}
