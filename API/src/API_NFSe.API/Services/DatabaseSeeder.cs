using System;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Prestadores;
using API_NFSe.Application.DTOs.Usuarios;
using API_NFSe.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace API_NFSe.API.Services
{
    public class DatabaseSeeder
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IPrestadorService _prestadorService;
        private readonly ILogger<DatabaseSeeder> _logger;

        private const string AdminNomePadrao = "Administrador";
        private const string AdminEmailPadrao = "carlos.pacheco@pacbel.com.br";
        private const string AdminSenhaPadrao = "Admin@123";
        private const string AdminRolePadrao = "Administrador";

        public DatabaseSeeder(
            IUsuarioService usuarioService,
            IPrestadorService prestadorService,
            ILogger<DatabaseSeeder> logger
        )
        {
            _usuarioService = usuarioService;
            _prestadorService = prestadorService;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            var prestadorPadrao = await GarantirPrestadorPadraoAsync();

            var existente = await _usuarioService.ObterPorEmailAsync(AdminEmailPadrao);
            if (existente != null)
            {
                if (existente.PrestadorId != prestadorPadrao.Id)
                {
                    var updateDto = new UpdateUsuarioDto
                    {
                        Nome = existente.Nome,
                        Email = existente.Email,
                        Role = existente.Role,
                        PrestadorId = prestadorPadrao.Id,
                    };

                    await _usuarioService.AtualizarAsync(existente.Id, updateDto);
                    _logger.LogInformation("Admin user updated to associate with default prestador.");
                }

                _logger.LogInformation("Admin user already exists. Skipping creation.");
                return;
            }

            var dto = new CreateUsuarioDto
            {
                Nome = AdminNomePadrao,
                Email = AdminEmailPadrao,
                Senha = AdminSenhaPadrao,
                Role = AdminRolePadrao,
                PrestadorId = prestadorPadrao.Id,
            };

            await _usuarioService.CriarAsync(dto);
            _logger.LogInformation("Admin user created successfully.");
        }

        private async Task<PrestadorDto> GarantirPrestadorPadraoAsync()
        {
            const string cnpjPadrao = "12345678000199";

            var existente = await _prestadorService.ObterPorCnpjAsync(cnpjPadrao);
            if (existente != null)
            {
                await GarantirConfiguracaoPadraoAsync(existente.Id);
                return existente;
            }

            try
            {
                var prestador = await _prestadorService.CriarAsync(
                    new CreatePrestadorDto
                    {
                        Cnpj = cnpjPadrao,
                        RazaoSocial = "Pacbel Sistemas Ltda",
                        NomeFantasia = "Pacbel",
                        InscricaoMunicipal = "123456",
                        InscricaoEstadual = null,
                        Cnae = null,
                        TipoEmissao = 1,
                        CodigoMunicipioIbge = "3205309",
                        OptanteSimplesNacional = 1,
                        RegimeEspecialTributario = 1,
                        Telefone = "+55 (27) 3333-0000",
                        Email = "contato@pontobrsistemas.com.br",
                        Website = "https://www.pontobrsistemas.com.br",
                        Endereco = new EnderecoDto
                        {
                            Logradouro = "Rua Projetada",
                            Numero = "100",
                            Complemento = null,
                            Bairro = "Centro",
                            CodigoMunicipioIbge = "3205309",
                            Uf = "ES",
                            Cep = "29000000",
                        }
                    },
                    Guid.Empty
                );

                await GarantirConfiguracaoPadraoAsync(prestador.Id);
                return prestador;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao criar prestador padrão. Verificando existência novamente.");
                var prestadorExistente = await _prestadorService.ObterPorCnpjAsync(cnpjPadrao);
                if (prestadorExistente is null)
                {
                    throw;
                }

                await GarantirConfiguracaoPadraoAsync(prestadorExistente.Id);
                return prestadorExistente;
            }
        }

        private async Task GarantirConfiguracaoPadraoAsync(Guid prestadorId)
        {
            var configuracaoExistente = await _prestadorService.ObterConfiguracaoAsync(prestadorId);
            if (configuracaoExistente != null && configuracaoExistente.HasSmtpPassword)
            {
                return;
            }

            var configuracaoDto = new UpsertPrestadorConfiguracaoDto
            {
                Ambiente = 2,
                VersaoAplicacao = "1.0.0",
                SeriePadrao = "A1",
                NumeroAtual = configuracaoExistente?.NumeroAtual ?? 1,
                UrlEnvio = configuracaoExistente?.UrlEnvio,
                UrlConsulta = configuracaoExistente?.UrlConsulta,
                EnviaEmailAutomatico = true,
                SmtpHost = "smtp.task.com.br",
                SmtpPort = 587,
                SmtpSecure = false,
                SmtpUser = "contato@pontobrsistemas.com.br",
                SmtpPassword = "PontobrJO2023*",
                SmtpFrom = "contato@pontobrsistemas.com.br",
                SmtpFromName = "Pacbel",
                SmtpResetPasswordUrl = "https://localhost:5179",
            };

            await _prestadorService.DefinirConfiguracaoAsync(
                prestadorId,
                configuracaoDto,
                Guid.Empty
            );
        }
    }
}
