using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Usuarios;

namespace API_NFSe.Application.Interfaces
{
    public interface IUsuarioService
    {
        Task<IEnumerable<UsuarioDto>> ObterTodosAsync(Guid? prestadorId = null);
        Task<UsuarioDto?> ObterPorIdAsync(Guid id);
        Task<UsuarioDto?> ObterPorEmailAsync(string email);
        Task<UsuarioDto> CriarAsync(CreateUsuarioDto dto);
        Task<UsuarioDto?> AtualizarAsync(Guid id, UpdateUsuarioDto dto);
        Task<bool> AlterarSenhaAsync(Guid id, string senhaAtual, string novaSenha);
        Task<bool> RemoverAsync(Guid id);
        Task SolicitarResetSenhaAsync(string email, string url);
        Task<bool> RedefinirSenhaAsync(string token, string novaSenha);
    }
}
