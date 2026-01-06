using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace API_NFSe.API.Authorization
{
    public class ScopeAuthorizationRequirement : IAuthorizationRequirement
    {
        public ScopeAuthorizationRequirement(IEnumerable<string> requiredScopes, IEnumerable<string>? allowedRoles = null)
        {
            if (requiredScopes == null)
            {
                throw new ArgumentNullException(nameof(requiredScopes));
            }

            var scopes = requiredScopes
                .Where(scope => !string.IsNullOrWhiteSpace(scope))
                .Select(scope => scope.Trim())
                .ToArray();

            var roles = (allowedRoles ?? Array.Empty<string>())
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Select(role => role.Trim())
                .ToArray();

            if (scopes.Length == 0 && roles.Length == 0)
            {
                throw new ArgumentException("É necessário informar pelo menos um escopo ou role para a autorização.");
            }

            RequiredScopes = scopes;
            AllowedRoles = roles;
        }

        public IReadOnlyCollection<string> RequiredScopes { get; }

        public IReadOnlyCollection<string> AllowedRoles { get; }
    }
}
