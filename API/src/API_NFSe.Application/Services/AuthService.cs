using System;
using System.Collections.Generic;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.DTOs.Auth;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace API_NFSe.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly ICryptographyService _cryptographyService;
        private readonly JwtSettings _jwtSettings;
        private readonly IEmailService _emailService;
        private readonly MfaSettings _mfaSettings;
        private readonly IRobotClientRepository _robotClientRepository;
        private readonly IPrestadorRepository _prestadorRepository;

        public AuthService(
            IUsuarioRepository usuarioRepository,
            ICryptographyService cryptographyService,
            JwtSettings jwtSettings,
            IEmailService emailService,
            MfaSettings mfaSettings,
            IRobotClientRepository robotClientRepository,
            IPrestadorRepository prestadorRepository
        )
        {
            _usuarioRepository = usuarioRepository;
            _cryptographyService = cryptographyService;
            _jwtSettings = jwtSettings;
            _emailService = emailService;
            _mfaSettings = mfaSettings;
            _robotClientRepository = robotClientRepository;
            _prestadorRepository = prestadorRepository;
        }

        public async Task<MfaChallengeResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var emailHash = _cryptographyService.ComputeSha256(dto.Email.ToLowerInvariant());
            var usuario = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);
            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
            {
                throw new UnauthorizedAccessException("Credenciais inválidas.");
            }

            var codigo = GerarCodigoMfa();
            var codigoHash = BCrypt.Net.BCrypt.HashPassword(codigo);
            var validade = DateTime.UtcNow.Add(_mfaSettings.ObterValidade());

            usuario.DefinirCodigoMfa(codigoHash, validade);
            _usuarioRepository.Atualizar(usuario);
            await _usuarioRepository.SaveChangesAsync();

            var emailDestinatario = _cryptographyService.Decrypt(usuario.EmailEncrypted);
            var nomeUsuario = _cryptographyService.Decrypt(usuario.NomeEncrypted);

            var codigoEnviado = false;
            if (!string.IsNullOrWhiteSpace(emailDestinatario))
            {
                var smtpSettings = await ObterSmtpSettingsAsync(usuario);
                var corpoEmail = await MontarCorpoEmailAsync(nomeUsuario, codigo, validade);
                await _emailService.EnviarAsync(
                    smtpSettings,
                    new[] { emailDestinatario },
                    _mfaSettings.AssuntoEmail,
                    corpoEmail
                );
                codigoEnviado = true;
            }

            return new MfaChallengeResponseDto
            {
                Email = dto.Email,
                CodigoEnviado = codigoEnviado,
                ExpiraEm = validade,
                Mensagem = codigoEnviado
                    ? "Código de verificação enviado para o e-mail cadastrado."
                    : "Código de verificação gerado, mas nenhum e-mail está cadastrado para o usuário."
            };
        }

        public async Task<AuthResponseDto> ConfirmarMfaAsync(ConfirmarMfaRequestDto dto)
        {
            var emailHash = _cryptographyService.ComputeSha256(dto.Email.ToLowerInvariant());
            var usuario = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);

            if (
                usuario == null
                || string.IsNullOrWhiteSpace(usuario.MfaCodeHash)
                || usuario.MfaCodeExpiraEm == null
            )
            {
                throw new UnauthorizedAccessException("Código MFA inválido.");
            }

            if (usuario.MfaCodeExpiraEm < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Código MFA expirado.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Codigo, usuario.MfaCodeHash))
            {
                throw new UnauthorizedAccessException("Código MFA incorreto.");
            }

            usuario.LimparCodigoMfa();
            return await GerarTokensAsync(usuario);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto)
        {
            var usuario = await _usuarioRepository.ObterPorRefreshTokenAsync(dto.RefreshToken);
            if (usuario == null)
            {
                throw new UnauthorizedAccessException("Refresh token inválido.");
            }

            return await GerarTokensAsync(usuario);
        }

        public async Task RevogarRefreshTokenAsync(string refreshToken)
        {
            var usuario = await _usuarioRepository.ObterPorRefreshTokenAsync(refreshToken);
            if (usuario == null)
            {
                return;
            }

            usuario.LimparRefreshToken();
            _usuarioRepository.Atualizar(usuario);
            await _usuarioRepository.SaveChangesAsync();
        }

        public async Task<AuthResponseDto> AutenticarRoboAsync(RobotAuthRequestDto dto)
        {
            var cliente = await _robotClientRepository.ObterPorClientIdAsync(dto.ClientId);

            if (cliente == null || !cliente.Ativo)
            {
                throw new UnauthorizedAccessException("Cliente robótico inexistente ou inativo.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.ClientSecret, cliente.SecretHash))
            {
                throw new UnauthorizedAccessException("Credenciais inválidas.");
            }

            var scopesPermitidos = ParseScopes(cliente.Scopes);
            var scopesSolicitados = string.IsNullOrWhiteSpace(dto.Scope)
                ? Array.Empty<string>()
                : dto.Scope
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (scopesSolicitados.Length > 0)
            {
                var naoAutorizados = scopesSolicitados
                    .Except(scopesPermitidos, StringComparer.OrdinalIgnoreCase)
                    .ToArray();

                if (naoAutorizados.Length > 0)
                {
                    throw new UnauthorizedAccessException("Escopos não autorizados para o cliente informado.");
                }
            }

            var token = GerarAccessTokenParaRobo(cliente, scopesSolicitados);

            return new AuthResponseDto
            {
                AccessToken = token.Token,
                ExpiraEm = token.ExpiraEm,
                RefreshToken = string.Empty
            };
        }

        private async Task<AuthResponseDto> GerarTokensAsync(Usuario usuario)
        {
            var accessToken = GerarAccessToken(usuario);
            var refreshToken = GerarRefreshToken();

            usuario.DefinirRefreshToken(refreshToken.Token, refreshToken.ExpiraEm);
            _usuarioRepository.Atualizar(usuario);
            await _usuarioRepository.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken.Token,
                ExpiraEm = accessToken.ExpiraEm,
                RefreshToken = refreshToken.Token
            };
        }

        private (string Token, DateTime ExpiraEm) GerarAccessToken(Usuario usuario)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, _cryptographyService.Decrypt(usuario.EmailEncrypted)),
                new Claim(ClaimTypes.Role, usuario.Role),
                new Claim("nome", _cryptographyService.Decrypt(usuario.NomeEncrypted))
            };

            var claimsList = new List<Claim>(claims);

            if (usuario.PrestadorId.HasValue)
            {
                claimsList.Add(new Claim("prestadorId", usuario.PrestadorId.Value.ToString()));
            }

            return GerarAccessToken(claimsList);
        }

        private (string Token, DateTime ExpiraEm) GerarAccessTokenParaRobo(RobotClient cliente, IEnumerable<string> scopesSolicitados)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, $"robot:{cliente.ClientId}"),
                new Claim("client_id", cliente.ClientId),
                new Claim(ClaimTypes.Role, cliente.Role)
            };

            claims.Add(new Claim("prestadorId", cliente.PrestadorId.ToString()));

            var scopesAplicados = scopesSolicitados?.ToArray() ?? Array.Empty<string>();
            if (scopesAplicados.Length > 0)
            {
                claims.Add(new Claim("scope", string.Join(' ', scopesAplicados)));
            }

            return GerarAccessToken(claims);
        }

        private static string[] ParseScopes(string? scopes)
        {
            if (string.IsNullOrWhiteSpace(scopes))
            {
                return Array.Empty<string>();
            }

            return scopes
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        private (string Token, DateTime ExpiraEm) GerarAccessToken(IEnumerable<Claim> claims)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiraEm = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expiraEm,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expiraEm);
        }

        private (string Token, DateTime ExpiraEm) GerarRefreshToken()
        {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var expiraEm = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays);
            return (token, expiraEm);
        }

        private static string GerarCodigoMfa()
        {
            return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
        }

        private async Task<string> MontarCorpoEmailAsync(string nome, string codigo, DateTime validadeUtc)
        {
            var caminhoTemplate = Path.Combine(AppContext.BaseDirectory, _mfaSettings.TemplatePath);
            string template;

            if (File.Exists(caminhoTemplate))
            {
                template = await File.ReadAllTextAsync(caminhoTemplate, Encoding.UTF8);
            }
            else
            {
                template =
                    "<p>Olá, {{NOME}}!</p><p>Seu código de verificação é <strong>{{CODIGO}}</strong>.</p><p>Ele expira em {{EXPIRACAO_LOCAL}}.</p>";
            }

            var expiracaoLocal = validadeUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture);

            return template
                .Replace("{{NOME}}", nome, StringComparison.OrdinalIgnoreCase)
                .Replace("{{CODIGO}}", codigo, StringComparison.OrdinalIgnoreCase)
                .Replace("{{EXPIRACAO_LOCAL}}", expiracaoLocal, StringComparison.OrdinalIgnoreCase);
        }

        private async Task<SmtpSettings> ObterSmtpSettingsAsync(Usuario usuario)
        {
            if (!usuario.PrestadorId.HasValue)
            {
                throw new InvalidOperationException("Usuário não possui prestador associado para envio de e-mails.");
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(usuario.PrestadorId.Value);

            if (prestador?.Configuracao == null || string.IsNullOrWhiteSpace(prestador.Configuracao.SmtpHost) || !prestador.Configuracao.SmtpPort.HasValue || string.IsNullOrWhiteSpace(prestador.Configuracao.SmtpFrom))
            {
                throw new InvalidOperationException("Configuração de e-mail não encontrada para o prestador associado.");
            }

            var senha = string.IsNullOrWhiteSpace(prestador.Configuracao.SmtpPasswordEncrypted)
                ? null
                : _cryptographyService.Decrypt(prestador.Configuracao.SmtpPasswordEncrypted);

            return new SmtpSettings
            {
                Host = prestador.Configuracao.SmtpHost,
                Port = prestador.Configuracao.SmtpPort,
                Secure = prestador.Configuracao.SmtpSecure,
                User = prestador.Configuracao.SmtpUser,
                Password = senha,
                From = prestador.Configuracao.SmtpFrom,
                FromName = prestador.Configuracao.SmtpFromName,
                ResetPasswordUrl = prestador.Configuracao.SmtpResetPasswordUrl
            };
        }
    }
}
