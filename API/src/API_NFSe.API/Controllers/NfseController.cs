using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Nfse;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/nfse")]
    [Authorize(Roles = $"{RoleNames.Robot},{RoleNames.Administrador}")]
    public class NfseController : ControllerBase
    {
        private readonly INfseSefinService _nfseSefinService;
        private readonly ICurrentUserService _currentUserService;

        public NfseController(INfseSefinService nfseSefinService, ICurrentUserService currentUserService)
        {
            _nfseSefinService = nfseSefinService;
            _currentUserService = currentUserService;
        }

        [HttpGet("certificados")]
        [Authorize(Policy = "Scopes.Nfse.Certificados")]
        public async Task<IActionResult> ListarCertificadosAsync()
        {
            try
            {
                var usuarioReferencia = _currentUserService.ObterIdentificador();
                var prestadorId = _currentUserService.ObterPrestadorId();
                if (!prestadorId.HasValue && !_currentUserService.PossuiRole(RoleNames.Administrador))
                {
                    return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
                }

                var listarTodos = _currentUserService.PossuiRole(RoleNames.Administrador);
                var certificados = await _nfseSefinService.ListarCertificadosAsync(usuarioReferencia, prestadorId, listarTodos);
                return Ok(certificados);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpGet("notas")]
        [Authorize(Policy = "Scopes.Nfse.Notas")]
        [ProducesResponseType(typeof(ListarNotasEmitidasResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> ListarNotasEmitidasAsync([FromQuery] ListarNotasEmitidasRequestDto request)
        {
            if (request is null)
            {
                return BadRequest("Filtros inválidos.");
            }

            if (request.Page <= 0 || request.PageSize <= 0 || request.PageSize > 100)
            {
                return BadRequest("Parâmetros de paginação inválidos.");
            }

            var usuarioReferencia = _currentUserService.ObterIdentificador();
            var prestadorId = _currentUserService.ObterPrestadorId();
            if (!prestadorId.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            var resposta = await _nfseSefinService.ListarNotasEmitidasAsync(usuarioReferencia, prestadorId.Value, request);
            return Ok(resposta);
        }

        [HttpPost("emitir")]
        [Authorize(Policy = "Scopes.Nfse.Emitir")]
        [ProducesResponseType(typeof(EmitirNfseResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> EmitirAsync([FromBody] EmitirNfseRequestDto request, CancellationToken cancellationToken)
        {
            if (request is null)
            {
                return BadRequest("Payload inválido.");
            }

            var usuarioReferencia = _currentUserService.ObterIdentificador();
            var prestadorId = _currentUserService.ObterPrestadorId();
            if (!prestadorId.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            var resposta = await _nfseSefinService.EmitirAsync(usuarioReferencia, prestadorId.Value, request, cancellationToken);
            return Ok(resposta);
        }

        [HttpPost("cancelar")]
        [Authorize(Policy = "Scopes.Nfse.Cancelar")]
        [ProducesResponseType(typeof(CancelarNfseResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CancelarAsync([FromBody] CancelarNfseRequestDto request, CancellationToken cancellationToken)
        {
            if (request is null)
            {
                return BadRequest("Payload inválido.");
            }

            var usuarioReferencia = _currentUserService.ObterIdentificador();
            var prestadorId = _currentUserService.ObterPrestadorId();
            if (!prestadorId.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            var resposta = await _nfseSefinService.CancelarAsync(usuarioReferencia, prestadorId.Value, request, cancellationToken);
            return Ok(resposta);
        }

        [HttpGet("danfse/{chaveAcesso}")]
        [Authorize(Policy = "Scopes.Nfse.Danfse")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> DownloadDanfseAsync(string chaveAcesso, [FromQuery] int ambiente = 2, [FromQuery] string? certificateId = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(chaveAcesso))
            {
                return BadRequest("chaveAcesso é obrigatória.");
            }

            var usuarioReferencia = _currentUserService.ObterIdentificador();
            var prestadorId = _currentUserService.ObterPrestadorId();
            if (!prestadorId.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            var request = new DownloadDanfseRequestDto
            {
                ChaveAcesso = chaveAcesso,
                Ambiente = ambiente,
                CertificateId = certificateId
            };

            var resposta = await _nfseSefinService.DownloadDanfseAsync(usuarioReferencia, prestadorId.Value, request, cancellationToken);
            return File(resposta.Content, resposta.ContentType, resposta.FileName);
        }
    }
}
