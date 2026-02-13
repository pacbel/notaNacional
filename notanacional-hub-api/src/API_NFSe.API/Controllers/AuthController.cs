using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Auth;
using API_NFSe.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUsuarioService _usuarioService;

        public AuthController(IAuthService authService, IUsuarioService usuarioService)
        {
            _authService = authService;
            _usuarioService = usuarioService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            try
            {
                var response = await _authService.LoginAsync(dto);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPost("confirm-mfa")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmarMfa([FromBody] ConfirmarMfaRequestDto dto)
        {
            try
            {
                var response = await _authService.ConfirmarMfaAsync(dto);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            try
            {
                var response = await _authService.RefreshTokenAsync(dto);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost("robot-token")]
        [AllowAnonymous]
        public async Task<IActionResult> AutenticarRobo([FromBody] RobotAuthRequestDto dto)
        {
            try
            {
                var response = await _authService.AutenticarRoboAsync(dto);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost("revoke")]
        [Authorize]
        public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequestDto dto)
        {
            try
            {
                await _authService.RevogarRefreshTokenAsync(dto.RefreshToken);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { mensagem = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
        {
            await _usuarioService.SolicitarResetSenhaAsync(dto.Email);
            return Accepted();
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
        {
            var sucesso = await _usuarioService.RedefinirSenhaAsync(dto.Token, dto.NovaSenha);
            if (!sucesso)
            {
                return BadRequest("Token inválido ou expirado.");
            }

            return NoContent();
        }
    }
}
