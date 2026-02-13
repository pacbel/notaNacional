using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class RobotClient : EntityBase
    {
        public string Nome { get; private set; } = string.Empty;
        public string ClientId { get; private set; } = string.Empty;
        public string SecretHash { get; private set; } = string.Empty;
        public string? Scopes { get; private set; }
        public string Role { get; private set; } = "Robot";
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        protected RobotClient() { }

        public RobotClient(string nome, string clientId, string secretHash, Guid prestadorId, string? scopes, string? role = null)
        {
            AtualizarNome(nome);
            DefinirClientId(clientId);
            DefinirSecretHash(secretHash);
            DefinirScopes(scopes);
            DefinirPrestador(prestadorId);
            DefinirRole(role ?? "Robot");
        }

        public void AtualizarNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
            {
                throw new ArgumentException("Nome inválido.", nameof(nome));
            }

            Nome = nome.Trim();
            AtualizarDataAtualizacao();
        }

        public void DefinirClientId(string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new ArgumentException("ClientId inválido.", nameof(clientId));
            }

            ClientId = clientId.Trim();
            AtualizarDataAtualizacao();
        }

        public void DefinirSecretHash(string secretHash)
        {
            if (string.IsNullOrWhiteSpace(secretHash))
            {
                throw new ArgumentException("Secret hash inválido.", nameof(secretHash));
            }

            SecretHash = secretHash;
            AtualizarDataAtualizacao();
        }

        public void RedefinirSecretHash(string novoSecretHash)
        {
            DefinirSecretHash(novoSecretHash);
        }

        public void DefinirScopes(string? scopes)
        {
            Scopes = string.IsNullOrWhiteSpace(scopes) ? null : scopes.Trim();
            AtualizarDataAtualizacao();
        }

        public void DefinirRole(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                throw new ArgumentException("Role inválida.", nameof(role));
            }

            Role = role.Trim();
            AtualizarDataAtualizacao();
        }

        public void DefinirPrestador(Guid prestadorId)
        {
            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            PrestadorId = prestadorId;
            AtualizarDataAtualizacao();
        }

        public void Inativar()
        {
            Desativar();
        }

        public void Reativar()
        {
            Ativar();
        }
    }
}
