using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Dps;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/prestadores/{prestadorId:guid}/dps")]
    public class DpsController : ControllerBase
    {
        private readonly IDpsService _dpsService;
        private readonly ICurrentUserService _currentUserService;

        private bool UsuarioEhRobot => _currentUserService.PossuiRole(RoleNames.Robot);

        public DpsController(IDpsService dpsService, ICurrentUserService currentUserService)
        {
            _dpsService = dpsService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [Authorize(Policy = "Scopes.Dps.Leitura")]
        public async Task<IActionResult> GetAll(Guid prestadorId, [FromQuery] string? status = null, [FromQuery] DateTimeOffset? dataInicio = null, [FromQuery] DateTimeOffset? dataFim = null)
        {
            try
            {
                var autorizacao = ValidarAcesso(prestadorId);
                if (autorizacao != null)
                {
                    return autorizacao;
                }

                var usuarioReferencia = _currentUserService.ObterIdentificador();
                var dps = await _dpsService.ObterTodosAsync(usuarioReferencia, prestadorId, status, dataInicio, dataFim);
                return Ok(dps);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{dpsId:guid}")]
        [Authorize(Policy = "Scopes.Dps.Leitura")]
        public async Task<IActionResult> GetById(Guid prestadorId, Guid dpsId)
        {
            try
            {
                var autorizacao = ValidarAcesso(prestadorId);
                if (autorizacao != null)
                {
                    return autorizacao;
                }

                var usuarioReferencia = _currentUserService.ObterIdentificador();
                var dps = await _dpsService.ObterPorIdAsync(usuarioReferencia, prestadorId, dpsId);
                if (dps == null)
                {
                    return NotFound();
                }

                return Ok(dps);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Policy = "Scopes.Dps.Criacao")]
        public async Task<IActionResult> Create(Guid prestadorId, [FromBody] CriarDpsRequestDto dto)
        {
            try
            {
                var autorizacao = ValidarAcesso(prestadorId);
                if (autorizacao != null)
                {
                    return autorizacao;
                }

                if (!ModelState.IsValid)
                {
                    return ValidationProblem(ModelState);
                }

                var usuarioReferencia = _currentUserService.ObterIdentificador();
                var usuarioId = ObterUsuarioResponsavel();
                var dps = await _dpsService.CriarAsync(usuarioReferencia, prestadorId, usuarioId, dto);
                return CreatedAtAction(nameof(GetById), new { prestadorId, dpsId = dps.Id }, dps);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        private IActionResult? ValidarAcesso(Guid prestadorId)
        {
            if (prestadorId == Guid.Empty)
            {
                return BadRequest("Prestador inválido.");
            }

            if (!UsuarioEhRobot)
            {
                return Forbid();
            }

            var prestadorUsuario = _currentUserService.ObterPrestadorId();
            if (!prestadorUsuario.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            if (prestadorUsuario.Value != prestadorId)
            {
                return Forbid();
            }

            return null;
        }

        private Guid ObterUsuarioResponsavel()
        {
            return Guid.Empty;
        }
    }
}
