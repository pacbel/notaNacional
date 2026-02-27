using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.DTOs.Usuarios;
using API_NFSe.Application.Interfaces;
using API_NFSe.Application.Security;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using AutoMapper;
using BCrypt.Net;

namespace API_NFSe.Application.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMapper _mapper;
        private readonly ICryptographyService _cryptographyService;
        private readonly IEmailService _emailService;
        private readonly IPrestadorRepository _prestadorRepository;

        private static readonly Dictionary<string, string> RolesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            [RoleNames.Administrador] = RoleNames.Administrador,
            [RoleNames.Gestao] = RoleNames.Gestao,
            [RoleNames.Operacao] = RoleNames.Operacao
        };

        private const string ResetSubject = "Redefinição de senha";

        public UsuarioService(
            IUsuarioRepository usuarioRepository,
            IMapper mapper,
            ICryptographyService cryptographyService,
            IEmailService emailService,
            IPrestadorRepository prestadorRepository
        )
        {
            _usuarioRepository = usuarioRepository;
            _mapper = mapper;
            _cryptographyService = cryptographyService;
            _emailService = emailService;
            _prestadorRepository = prestadorRepository;
        }

        public async Task<IEnumerable<UsuarioDto>> ObterTodosAsync(Guid? prestadorId = null)
        {
            IEnumerable<Usuario> usuarios;
            
            if (prestadorId.HasValue)
            {
                usuarios = await _usuarioRepository.ObterPorPrestadorAsync(prestadorId.Value);
            }
            else
            {
                usuarios = await _usuarioRepository.ObterTodosAsync();
            }
            
            return usuarios.Select(MapearParaDto);
        }

        public async Task<UsuarioDto?> ObterPorIdAsync(Guid id)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            return usuario == null ? null : MapearParaDto(usuario);
        }

        public async Task<UsuarioDto?> ObterPorEmailAsync(string email)
        {
            var emailHash = _cryptographyService.ComputeSha256(email.ToLowerInvariant());
            var usuario = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);
            return usuario == null ? null : MapearParaDto(usuario);
        }

        public async Task<UsuarioDto> CriarAsync(CreateUsuarioDto dto)
        {
            ValidarSenhaForte(dto.Senha);
            var roleNormalizada = NormalizarRoleHumana(dto.Role);

            var emailHash = _cryptographyService.ComputeSha256(dto.Email.ToLowerInvariant());
            var existente = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);
            if (existente != null)
            {
                throw new InvalidOperationException("E-mail já cadastrado.");
            }

            var usuario = new Usuario(
                _cryptographyService.Encrypt(dto.Nome),
                _cryptographyService.Encrypt(dto.Email.ToLowerInvariant()),
                emailHash,
                BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                roleNormalizada,
                dto.PrestadorId
            );

            await _usuarioRepository.AdicionarAsync(usuario);
            await _usuarioRepository.SaveChangesAsync();

            return MapearParaDto(usuario);
        }

        public async Task<UsuarioDto?> AtualizarAsync(Guid id, UpdateUsuarioDto dto)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            if (usuario == null)
            {
                return null;
            }

            var emailHash = _cryptographyService.ComputeSha256(dto.Email.ToLowerInvariant());
            var jaExiste = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);
            if (jaExiste != null && jaExiste.Id != usuario.Id)
            {
                throw new InvalidOperationException("E-mail já utilizado por outro usuário.");
            }

            usuario.AtualizarDados(
                _cryptographyService.Encrypt(dto.Nome),
                _cryptographyService.Encrypt(dto.Email.ToLowerInvariant()),
                emailHash
            );

            var roleNormalizada = NormalizarRoleHumana(dto.Role);
            usuario.DefinirRole(roleNormalizada);
            usuario.AtribuirPrestador(dto.PrestadorId);

            if (!string.IsNullOrWhiteSpace(dto.Senha))
            {
                ValidarSenhaForte(dto.Senha);
                usuario.AtualizarSenha(BCrypt.Net.BCrypt.HashPassword(dto.Senha));
            }

            _usuarioRepository.Atualizar(usuario);
            await _usuarioRepository.SaveChangesAsync();

            return MapearParaDto(usuario);
        }

        public async Task<bool> AlterarSenhaAsync(Guid id, string senhaAtual, string novaSenha)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            if (usuario == null)
            {
                return false;
            }

            if (!BCrypt.Net.BCrypt.Verify(senhaAtual, usuario.SenhaHash))
            {
                return false;
            }

            ValidarSenhaForte(novaSenha);

            usuario.AtualizarSenha(BCrypt.Net.BCrypt.HashPassword(novaSenha));
            _usuarioRepository.Atualizar(usuario);
            return await _usuarioRepository.SaveChangesAsync() > 0;
        }

        public async Task<bool> RemoverAsync(Guid id)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            if (usuario == null)
            {
                return false;
            }

            _usuarioRepository.Remover(id);
            return await _usuarioRepository.SaveChangesAsync() > 0;
        }

        public async Task SolicitarResetSenhaAsync(string email, string url)
        {
            var emailHash = _cryptographyService.ComputeSha256(email.ToLowerInvariant());
            var usuario = await _usuarioRepository.ObterPorEmailHashAsync(emailHash);
            if (usuario == null)
            {
                return;
            }

            var token = Guid.NewGuid().ToString("N");
            var validade = DateTime.UtcNow.AddHours(1);
            usuario.DefinirResetToken(token, validade);
            _usuarioRepository.Atualizar(usuario);
            await _usuarioRepository.SaveChangesAsync();

            var smtpSettings = await ObterSmtpSettingsAsync(usuario.PrestadorId);

            var link = $"<p><a href={url}/recuperar-senha?token={token}>Clique aqui para redefinir sua senha</a></p>";

            var corpo = $@"<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir sua senha.</p>
<p>Use o token abaixo para completar a redefinição:</p>
<p><strong>{token}</strong></p>
{link}
<p>Este token expira em {validade:dd/MM/yyyy HH:mm} (UTC).</p>
<p>Se você não solicitou essa alteração, ignore este e-mail.</p>";

            await _emailService.EnviarAsync(
                smtpSettings,
                new[] { email },
                ResetSubject,
                corpo
            );
        }

        public async Task<bool> RedefinirSenhaAsync(string token, string novaSenha)
        {
            var usuario = await _usuarioRepository.ObterPorResetTokenAsync(token);
            if (usuario == null)
            {
                return false;
            }

            ValidarSenhaForte(novaSenha);

            usuario.AtualizarSenha(BCrypt.Net.BCrypt.HashPassword(novaSenha));
            usuario.LimparResetToken();
            _usuarioRepository.Atualizar(usuario);
            return await _usuarioRepository.SaveChangesAsync() > 0;
        }

        private UsuarioDto MapearParaDto(Usuario usuario)
        {
            var dto = _mapper.Map<UsuarioDto>(usuario);
            dto.Nome = _cryptographyService.Decrypt(usuario.NomeEncrypted);
            dto.Email = _cryptographyService.Decrypt(usuario.EmailEncrypted);
            return dto;
        }

        private static void ValidarSenhaForte(string senha)
        {
            if (string.IsNullOrWhiteSpace(senha) || senha.Length < 8)
            {
                throw new InvalidOperationException("A senha deve possuir pelo menos 8 caracteres.");
            }

            if (!Regex.IsMatch(senha, @"[A-Z]"))
            {
                throw new InvalidOperationException("A senha deve possuir pelo menos uma letra maiúscula.");
            }

            if (!Regex.IsMatch(senha, @"[a-z]"))
            {
                throw new InvalidOperationException("A senha deve possuir pelo menos uma letra minúscula.");
            }

            if (!Regex.IsMatch(senha, @"[0-9]"))
            {
                throw new InvalidOperationException("A senha deve possuir pelo menos um número.");
            }

            if (!Regex.IsMatch(senha, @"[!@#$%^&*(),.?\""':{}|<>]"))
            {
                throw new InvalidOperationException("A senha deve possuir pelo menos um caractere especial.");
            }
        }

        private static string NormalizarRoleHumana(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                throw new InvalidOperationException("Role é obrigatória. Utilize Administrador, Gestao ou Operacao.");
            }

            var roleTrim = role.Trim();

            if (string.Equals(roleTrim, RoleNames.Robot, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Use o endpoint de clientes robóticos para gerenciar usuários do tipo Robot.");
            }

            if (RolesPermitidas.TryGetValue(roleTrim, out var roleNormalizada))
            {
                return roleNormalizada;
            }

            throw new InvalidOperationException("Role inválida. Utilize Administrador, Gestao ou Operacao.");
        }

        private async Task<SmtpSettings> ObterSmtpSettingsAsync(Guid? prestadorId)
        {
            if (!prestadorId.HasValue)
            {
                throw new InvalidOperationException("Usuário não possui prestador associado para envio de e-mails.");
            }

            var prestador = await _prestadorRepository.ObterPorIdComRelacoesAsync(prestadorId.Value);

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
