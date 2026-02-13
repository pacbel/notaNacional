using System;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Emails;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    /// <summary>
    ///     Endpoint para envio manual de e-mails utilizando as credenciais SMTP configuradas no prestador.
    /// </summary>
    /// <remarks>
    ///     <para>Requer autenticação com usuário robótico associado a um prestador ativo.</para>
    ///     <para>Escopo necessário: <c>nfse.email</c>.</para>
    /// </remarks>
    [ApiController]
    [Route("api/nfse/emails")]
    [Authorize(Roles = RoleNames.Robot)]
    public class EmailsController : ControllerBase
    {
        private readonly IEmailEnvioService _emailEnvioService;
        private readonly ICurrentUserService _currentUserService;

        public EmailsController(IEmailEnvioService emailEnvioService, ICurrentUserService currentUserService)
        {
            _emailEnvioService = emailEnvioService ?? throw new ArgumentNullException(nameof(emailEnvioService));
            _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        }

        /// <summary>
        ///     Envia um e-mail utilizando a configuração SMTP do prestador autenticado.
        /// </summary>
        /// <param name="request">Payload com destinatários, assunto, corpo HTML e anexos em Base64.</param>
        /// <param name="cancellationToken">Token de cancelamento da requisição.</param>
        /// <returns><see cref="NoContentResult"/> em caso de sucesso.</returns>
        /// <response code="204">E-mail enviado com sucesso.</response>
        /// <response code="400">Dados inválidos na requisição.</response>
        /// <response code="401">Usuário não autenticado ou prestador não associado.</response>
        /// <response code="403">Escopo ou role não autorizados.</response>
        [HttpPost]
        [Authorize(Policy = "Scopes.Nfse.Email")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> EnviarAsync([FromBody] EnviarEmailRequestDto request, CancellationToken cancellationToken)
        {
            if (request is null)
            {
                return BadRequest("Payload inválido.");
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var prestadorId = _currentUserService.ObterPrestadorId();
            if (!prestadorId.HasValue)
            {
                return Unauthorized(new { mensagem = "Prestador não associado ao usuário autenticado." });
            }

            await _emailEnvioService.EnviarAsync(prestadorId.Value, request, cancellationToken);
            return NoContent();
        }
    }
}
