using System;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Bilhetagem;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/prestadores/{prestadorId:guid}/bilhetagem")]
    [Authorize(Roles = $"{RoleNames.Robot},{RoleNames.Administrador},{RoleNames.Gestao}")]
    public class BilhetagemController : ControllerBase
    {
        private readonly IBilhetagemService _bilhetagemService;
        private readonly ICurrentUserService _currentUserService;

        public BilhetagemController(IBilhetagemService bilhetagemService, ICurrentUserService currentUserService)
        {
            _bilhetagemService = bilhetagemService;
            _currentUserService = currentUserService;
        }

        [HttpGet("saldo")]
        [ProducesResponseType(typeof(BilhetagemSaldoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ObterSaldo(Guid prestadorId, CancellationToken cancellationToken)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, requerPermissaoEdicao: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var saldo = await _bilhetagemService.ObterSaldoAsync(prestadorId, cancellationToken);
                return Ok(saldo);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("lancamentos")]
        [ProducesResponseType(typeof(BilhetagemLancamentoDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ObterLancamentos(Guid prestadorId, [FromQuery] int limite = 50, CancellationToken cancellationToken = default)
        {
            try
            {
                var acesso = ValidarAcesso(prestadorId, requerPermissaoEdicao: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var lancamentos = await _bilhetagemService.ObterLancamentosAsync(prestadorId, limite, cancellationToken);
                return Ok(lancamentos);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPost("creditos")]
        [ProducesResponseType(typeof(BilhetagemSaldoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AdicionarCreditos(Guid prestadorId, [FromBody] AdicionarCreditoBilhetagemRequestDto request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var acesso = ValidarAcesso(prestadorId, requerPermissaoEdicao: true);
                if (acesso != null)
                {
                    return acesso;
                }

                var usuarioId = _currentUserService.ObterUsuarioId();
                var saldo = await _bilhetagemService.AdicionarCreditosAsync(prestadorId, request.Quantidade, usuarioId, request.Observacao, cancellationToken);
                return Ok(saldo);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        private IActionResult? ValidarAcesso(Guid prestadorId, bool requerPermissaoEdicao)
        {
            if (prestadorId == Guid.Empty)
            {
                return BadRequest(new { mensagem = "Prestador inválido." });
            }

            var usuarioPrestadorId = _currentUserService.ObterPrestadorId();
            var ehAdministrador = _currentUserService.PossuiRole(RoleNames.Administrador);

            if (!ehAdministrador)
            {
                if (!usuarioPrestadorId.HasValue || usuarioPrestadorId.Value != prestadorId)
                {
                    return Forbid();
                }
            }

            return null;
        }
    }
}
