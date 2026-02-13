using System;

namespace API_NFSe.Application.Interfaces
{
    public interface ICurrentUserService
    {
        bool UsuarioAutenticado { get; }
        string ObterIdentificador();
        Guid ObterUsuarioId();
        Guid? ObterPrestadorId();
        bool PossuiRole(string role);
    }
}
