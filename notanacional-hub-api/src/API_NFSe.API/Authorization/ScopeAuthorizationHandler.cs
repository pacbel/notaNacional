using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace API_NFSe.API.Authorization
{
    public class ScopeAuthorizationHandler : AuthorizationHandler<ScopeAuthorizationRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ScopeAuthorizationRequirement requirement)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            if (requirement == null)
            {
                throw new ArgumentNullException(nameof(requirement));
            }

            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Task.CompletedTask;
            }

            if (requirement.AllowedRoles.Count > 0)
            {
                var possuiRolePermitida = requirement.AllowedRoles
                    .Any(role => context.User.IsInRole(role));

                if (possuiRolePermitida)
                {
                    context.Succeed(requirement);
                    return Task.CompletedTask;
                }
            }

            if (requirement.RequiredScopes.Count == 0)
            {
                return Task.CompletedTask;
            }

            var scopeClaim = context.User.FindFirst("scope");
            if (scopeClaim == null || string.IsNullOrWhiteSpace(scopeClaim.Value))
            {
                return Task.CompletedTask;
            }

            var scopesDoToken = scopeClaim.Value
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var possuiEscopo = requirement.RequiredScopes
                .All(scope => scopesDoToken.Contains(scope, StringComparer.OrdinalIgnoreCase));

            if (possuiEscopo)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
