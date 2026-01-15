using API_NFSe.Application.DTOs.Usuarios;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{RoleNames.Robot},{RoleNames.Administrador}")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var usuarios = await _usuarioService.ObterTodosAsync();
                return Ok(usuarios);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var usuario = await _usuarioService.ObterPorIdAsync(id);
                if (usuario == null)
                {
                    return NotFound();
                }

                return Ok(usuario);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUsuarioDto dto)
        {
            try
            {
                if (string.Equals(dto.Role, "Robot", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(
                        "Use o endpoint de clientes robóticos para gerenciar usuários do tipo Robot."
                    );
                }

                var usuario = await _usuarioService.CriarAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUsuarioDto dto)
        {
            try
            {
                if (string.Equals(dto.Role, "Robot", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(
                        "Use o endpoint de clientes robóticos para gerenciar usuários do tipo Robot."
                    );
                }

                var usuario = await _usuarioService.AtualizarAsync(id, dto);
                if (usuario == null)
                {
                    return NotFound();
                }

                return Ok(usuario);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id:guid}/senha")]
        public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordDto dto)
        {
            try
            {
                var alterou = await _usuarioService.AlterarSenhaAsync(
                    id,
                    dto.SenhaAtual,
                    dto.NovaSenha
                );
                if (!alterou)
                {
                    return BadRequest("Não foi possível alterar a senha.");
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var removido = await _usuarioService.RemoverAsync(id);
                if (!removido)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }
    }
}
