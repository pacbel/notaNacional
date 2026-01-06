using System;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Prestadores;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = RoleNames.Administrador + "," + RoleNames.Gestao + "," + RoleNames.Operacao)]
    public class PrestadoresController : ControllerBase
    {
        private readonly IPrestadorService _prestadorService;
        private readonly ICurrentUserService _currentUserService;

        private bool UsuarioEhAdministrador => _currentUserService.PossuiRole(RoleNames.Administrador);
        private bool UsuarioEhGestao => _currentUserService.PossuiRole(RoleNames.Gestao);
        private bool UsuarioEhOperacao => _currentUserService.PossuiRole(RoleNames.Operacao);

        public PrestadoresController(IPrestadorService prestadorService, ICurrentUserService currentUserService)
        {
            _prestadorService = prestadorService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                if (UsuarioEhAdministrador)
                {
                    var prestadoresAdmin = await _prestadorService.ObterTodosAsync();
                    return Ok(prestadoresAdmin);
                }

                if (!UsuarioEhGestao && !UsuarioEhOperacao)
                {
                    return Forbid();
                }

                var prestadorUsuarioId = _currentUserService.ObterPrestadorId();
                if (!prestadorUsuarioId.HasValue)
                {
                    return Forbid();
                }

                var prestador = await _prestadorService.ObterPorIdAsync(prestadorUsuarioId.Value);
                var resultado = prestador == null
                    ? Array.Empty<PrestadorDto>()
                    : new[] { prestador };

                return Ok(resultado);
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
                var acessivel = ValidarAcesso(id);
                if (acessivel != null)
                {
                    return acessivel;
                }

                var prestador = await _prestadorService.ObterPorIdAsync(id);
                if (prestador == null)
                {
                    return NotFound();
                }

                return Ok(prestador);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> Create([FromBody] CreatePrestadorDto dto)
        {
            try
            {
                var usuarioId = _currentUserService.ObterUsuarioId();
                var prestador = await _prestadorService.CriarAsync(dto, usuarioId);
                return CreatedAtAction(nameof(GetById), new { id = prestador.Id }, prestador);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = RoleNames.Administrador + "," + RoleNames.Gestao)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePrestadorDto dto)
        {
            try
            {
                var acessivel = ValidarAcesso(id, apenasAdministrador: false, requerPermissaoEdicao: true);
                if (acessivel != null)
                {
                    return acessivel;
                }

                var usuarioId = _currentUserService.ObterUsuarioId();
                var prestador = await _prestadorService.AtualizarAsync(id, dto, usuarioId);
                if (prestador == null)
                {
                    return NotFound();
                }

                return Ok(prestador);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = RoleNames.Administrador)]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var acessivel = ValidarAcesso(id, apenasAdministrador: true);
                if (acessivel != null)
                {
                    return acessivel;
                }

                var usuarioId = _currentUserService.ObterUsuarioId();
                var removido = await _prestadorService.RemoverAsync(id, usuarioId);
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

        [HttpGet("{prestadorId:guid}/configuracao")]
        public async Task<IActionResult> ObterConfiguracao(Guid prestadorId)
        {
            try
            {
                var acessivel = ValidarAcesso(prestadorId);
                if (acessivel != null)
                {
                    return acessivel;
                }

                var configuracao = await _prestadorService.ObterConfiguracaoAsync(prestadorId);
                if (configuracao == null)
                {
                    return NotFound();
                }

                return Ok(configuracao);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{prestadorId:guid}/configuracao")]
        [Authorize(Roles = RoleNames.Administrador + "," + RoleNames.Gestao)]
        public async Task<IActionResult> DefinirConfiguracao(Guid prestadorId, [FromBody] UpsertPrestadorConfiguracaoDto dto)
        {
            try
            {
                var acessivel = ValidarAcesso(prestadorId, requerPermissaoEdicao: true);
                if (acessivel != null)
                {
                    return acessivel;
                }

                var usuarioId = _currentUserService.ObterUsuarioId();
                var configuracao = await _prestadorService.DefinirConfiguracaoAsync(prestadorId, dto, usuarioId);
                return Ok(configuracao);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        private IActionResult? ValidarAcesso(Guid prestadorId, bool apenasAdministrador = false, bool requerPermissaoEdicao = false)
        {
            if (prestadorId == Guid.Empty)
            {
                return BadRequest("Prestador inválido.");
            }

            if (UsuarioEhAdministrador)
            {
                return null;
            }

            if (apenasAdministrador)
            {
                return Forbid();
            }

            if (!UsuarioEhGestao && !UsuarioEhOperacao)
            {
                return Forbid();
            }

            var prestadorUsuario = _currentUserService.ObterPrestadorId();
            if (!prestadorUsuario.HasValue || prestadorUsuario.Value != prestadorId)
            {
                return Forbid();
            }

            if (requerPermissaoEdicao && !UsuarioEhGestao)
            {
                return Forbid();
            }

            return null;
        }
    }
}
