using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API_NFSe.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace API_NFSe.API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public bool UsuarioAutenticado => User?.Identity?.IsAuthenticated ?? false;

        public string ObterIdentificador()
        {
            if (!UsuarioAutenticado)
            {
                throw new InvalidOperationException("Usuário não autenticado.");
            }

            var claim = User?.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User?.FindFirst(JwtRegisteredClaimNames.Sub);

            if (claim == null || string.IsNullOrWhiteSpace(claim.Value))
            {
                throw new InvalidOperationException("Não foi possível determinar o identificador do usuário autenticado.");
            }

            return claim.Value;
        }

        public Guid ObterUsuarioId()
        {
            var identificador = ObterIdentificador();

            if (!Guid.TryParse(identificador, out var usuarioId))
            {
                if (identificador.Substring(0,5).ToLower() != "robot")
                throw new InvalidOperationException("Não foi possível determinar o usuário autenticado.");
            }

            return usuarioId;
        }

        public Guid? ObterPrestadorId()
        {
            if (!UsuarioAutenticado)
            {
                return null;
            }

            var claim = User?.FindFirst("prestadorId");
            if (claim != null && Guid.TryParse(claim.Value, out var prestadorId))
            {
                return prestadorId;
            }

            return null;
        }

        public bool PossuiRole(string role)
        {
            if (string.IsNullOrWhiteSpace(role) || !UsuarioAutenticado)
            {
                return false;
            }

            return User?.IsInRole(role) ?? false;
        }
    }
}
