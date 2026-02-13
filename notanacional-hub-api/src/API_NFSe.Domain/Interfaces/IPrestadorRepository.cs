using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IPrestadorRepository : IRepositoryBase<Prestador>
    {
        Task<Prestador?> ObterPorCnpjAsync(string cnpj);
        Task<IEnumerable<Prestador>> ObterPorUsuarioAsync(Guid usuarioId);
        Task<IEnumerable<Prestador>> ObterTodosComRelacoesAsync();
        Task<Prestador?> ObterPorIdComRelacoesAsync(Guid id);
        Task AdicionarConfiguracaoAsync(PrestadorConfiguracao configuracao);
    }
}
