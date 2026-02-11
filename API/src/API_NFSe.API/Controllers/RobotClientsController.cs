using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.RobotClients;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/prestadores/{prestadorId:guid}/robot-clients")]
    [Authorize(Roles = $"{RoleNames.Robot},{RoleNames.Administrador}")]
    public class RobotClientsController : ControllerBase
    {
        private readonly IRobotClientService _robotClientService;
        private readonly ICurrentUserService _currentUserService;

        public RobotClientsController(
            IRobotClientService robotClientService,
            ICurrentUserService currentUserService
        )
        {
            _robotClientService = robotClientService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            Guid prestadorId,
            [FromQuery] bool incluirInativos = false
        )
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId);
                if (acesso != null)
                {
                    return acesso;
                }

                var clientes = await _robotClientService.ObterTodosAsync(prestadorId, incluirInativos);
                return Ok(clientes);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid prestadorId, Guid id)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId);
                if (acesso != null)
                {
                    return acesso;
                }

                var cliente = await _robotClientService.ObterPorIdAsync(prestadorId, id);
                if (cliente == null)
                {
                    return NotFound();
                }

                return Ok(cliente);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = RoleNames.Administrador)]
        [Authorize(Policy = "Scopes.Nfse.Robot")]
        public async Task<IActionResult> Create(Guid prestadorId, [FromBody] CreateRobotClientDto dto)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, somenteAdministrador: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var cliente = await _robotClientService.CriarAsync(prestadorId, dto);
                return CreatedAtAction(nameof(GetById), new { prestadorId, id = cliente.Id }, cliente);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> Update(
            Guid prestadorId,
            Guid id,
            [FromBody] UpdateRobotClientDto dto
        )
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, somenteAdministrador: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var cliente = await _robotClientService.AtualizarAsync(prestadorId, id, dto);
                if (cliente == null)
                {
                    return NotFound();
                }

                return Ok(cliente);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> Delete(Guid prestadorId, Guid id)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, somenteAdministrador: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var removido = await _robotClientService.InativarAsync(prestadorId, id);
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

        [HttpPost("{id:guid}/reativar")]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> Reactivate(Guid prestadorId, Guid id)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, somenteAdministrador: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var reativado = await _robotClientService.ReativarAsync(prestadorId, id);
                if (!reativado)
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

        [HttpPost("{id:guid}/rotate-secret")]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> RotateSecret(
            Guid prestadorId,
            Guid id,
            [FromBody] RotateRobotClientSecretDto dto
        )
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, somenteAdministrador: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var atualizado = await _robotClientService.RotacionarSecretAsync(
                    prestadorId,
                    id,
                    dto.NovoSecret
                );
                if (!atualizado)
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

        private IActionResult? ValidarAcesso(Guid prestadorId, bool somenteAdministrador = false)
        {
            if (prestadorId == Guid.Empty)
            {
                return BadRequest("Prestador inválido.");
            }

            if (_currentUserService.PossuiRole(RoleNames.Administrador))
            {
                return null;
            }

            if (somenteAdministrador)
            {
                return Forbid();
            }

            var prestadorUsuario = _currentUserService.ObterPrestadorId();
            if (prestadorUsuario.HasValue && prestadorUsuario.Value == prestadorId)
            {
                return null;
            }

            return Forbid();
        }
    }
}
