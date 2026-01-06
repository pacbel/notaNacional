using System;
using System.Collections.Generic;
using API_NFSe.Application.Security;
using Microsoft.AspNetCore.Authorization;

namespace API_NFSe.API.Authorization
{
    public static class ScopeAuthorizationExtensions
    {
        public static AuthorizationOptions AddScopePolicy(
            this AuthorizationOptions options,
            string policyName,
            IEnumerable<string> requiredScopes,
            IEnumerable<string>? allowedRoles = null)
        {
            if (options == null)
            {
                throw new ArgumentNullException(nameof(options));
            }

            if (string.IsNullOrWhiteSpace(policyName))
            {
                throw new ArgumentException("Nome da política não pode ser vazio.", nameof(policyName));
            }

            var requirement = new ScopeAuthorizationRequirement(requiredScopes, allowedRoles);

            options.AddPolicy(policyName, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.AddRequirements(requirement);
            });

            return options;
        }

        public static AuthorizationOptions AddRobotScopePolicy(
            this AuthorizationOptions options,
            string policyName,
            params string[] requiredScopes)
        {
            return options.AddScopePolicy(policyName, requiredScopes);
        }

        public static AuthorizationOptions AddRobotScopePolicy(
            this AuthorizationOptions options,
            string policyName,
            IEnumerable<string> requiredScopes,
            IEnumerable<string>? allowedRoles)
        {
            return options.AddScopePolicy(policyName, requiredScopes, allowedRoles);
        }
    }
}
