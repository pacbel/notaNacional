using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class Usuario : EntityBase
    {
        public string NomeEncrypted { get; private set; } = string.Empty;
        public string EmailEncrypted { get; private set; } = string.Empty;
        public string EmailHash { get; private set; } = string.Empty;
        public string SenhaHash { get; private set; } = string.Empty;
        public string Role { get; private set; } = "User";
        public string? ResetToken { get; private set; }
        public DateTime? ResetTokenExpiraEm { get; private set; }
        public string? RefreshToken { get; private set; }
        public DateTime? RefreshTokenExpiraEm { get; private set; }
        public string? MfaCodeHash { get; private set; }
        public DateTime? MfaCodeExpiraEm { get; private set; }
        public Guid? PrestadorId { get; private set; }
        public Prestador? Prestador { get; private set; }

        protected Usuario() { }

        public Usuario(
            string nomeEncrypted,
            string emailEncrypted,
            string emailHash,
            string senhaHash,
            string role,
            Guid? prestadorId = null
        )
        {
            NomeEncrypted = nomeEncrypted;
            EmailEncrypted = emailEncrypted;
            EmailHash = emailHash;
            SenhaHash = senhaHash;
            Role = role;
            PrestadorId = prestadorId;
        }

        public void AtualizarDados(string nomeEncrypted, string emailEncrypted, string emailHash)
        {
            NomeEncrypted = nomeEncrypted;
            EmailEncrypted = emailEncrypted;
            EmailHash = emailHash;
            AtualizarDataAtualizacao();
        }

        public void AtualizarSenha(string senhaHash)
        {
            SenhaHash = senhaHash;
            AtualizarDataAtualizacao();
        }

        public void DefinirRole(string role)
        {
            Role = role;
            AtualizarDataAtualizacao();
        }

        public void AtribuirPrestador(Guid? prestadorId)
        {
            PrestadorId = prestadorId;
            AtualizarDataAtualizacao();
        }

        public void DefinirResetToken(string token, DateTime validade)
        {
            ResetToken = token;
            ResetTokenExpiraEm = validade;
            AtualizarDataAtualizacao();
        }

        public void LimparResetToken()
        {
            ResetToken = null;
            ResetTokenExpiraEm = null;
            AtualizarDataAtualizacao();
        }

        public void DefinirRefreshToken(string token, DateTime validade)
        {
            RefreshToken = token;
            RefreshTokenExpiraEm = validade;
            AtualizarDataAtualizacao();
        }

        public void LimparRefreshToken()
        {
            RefreshToken = null;
            RefreshTokenExpiraEm = null;
            AtualizarDataAtualizacao();
        }

        public void DefinirCodigoMfa(string codigoHash, DateTime validade)
        {
            MfaCodeHash = codigoHash;
            MfaCodeExpiraEm = validade;
            AtualizarDataAtualizacao();
        }

        public void LimparCodigoMfa()
        {
            MfaCodeHash = null;
            MfaCodeExpiraEm = null;
            AtualizarDataAtualizacao();
        }
    }
}
