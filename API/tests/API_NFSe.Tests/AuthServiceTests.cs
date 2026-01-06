using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.DTOs.Auth;
using API_NFSe.Application.Services;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Tests.Fakes;
using Moq;
using Xunit;

namespace API_NFSe.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepositoryMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();
    private readonly Mock<IRobotClientRepository> _robotClientRepositoryMock = new();
    private readonly Mock<IPrestadorRepository> _prestadorRepositoryMock = new();
    private readonly JwtSettings _jwtSettings = new()
    {
        Issuer = "API_NFSe",
        Audience = "API_NFSe.Tests",
        SecretKey = "test-secret-key-1234567890-test-secret-key-1234567890",
        AccessTokenMinutes = 30,
        RefreshTokenDays = 7,
    };
    private readonly MfaSettings _mfaSettings = new();
    private readonly FakeCryptographyService _cryptographyService = new();

    [Fact]
    public async Task AutenticarRoboAsync_ComCredenciaisValidas_DeveGerarTokenComClaims()
    {
        // Arrange
        var prestadorId = Guid.NewGuid();
        var secret = "senha-super-secreta";
        var robotClient = new RobotClient(
            "Robo Fiscal",
            "client-app",
            BCrypt.Net.BCrypt.HashPassword(secret),
            prestadorId,
            "dps:criar dps:ler"
        );

        _robotClientRepositoryMock
            .Setup(repo => repo.ObterPorClientIdAsync(robotClient.ClientId))
            .ReturnsAsync(robotClient);

        var service = CriarAuthService();
        var request = new RobotAuthRequestDto
        {
            ClientId = robotClient.ClientId,
            ClientSecret = secret,
            Scope = "dps:criar",
        };

        // Act
        var response = await service.AutenticarRoboAsync(request);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
        Assert.True(response.ExpiraEm > DateTime.UtcNow);
        Assert.True(string.IsNullOrEmpty(response.RefreshToken));

        var token = new JwtSecurityTokenHandler().ReadJwtToken(response.AccessToken);
        Assert.Contains(
            token.Claims,
            claim => claim.Type == "client_id" && claim.Value == robotClient.ClientId
        );
        Assert.Contains(
            token.Claims,
            claim => claim.Type == "prestadorId" && claim.Value == prestadorId.ToString()
        );
        Assert.Contains(
            token.Claims,
            claim => claim.Type == "scope" && claim.Value.Contains("dps:criar")
        );
    }

    [Fact]
    public async Task AutenticarRoboAsync_ComEscopoNaoAutorizado_DeveLancarUnauthorized()
    {
        // Arrange
        var prestadorId = Guid.NewGuid();
        var secret = "senha-super-secreta";
        var robotClient = new RobotClient(
            "Robo Fiscal",
            "client-app",
            BCrypt.Net.BCrypt.HashPassword(secret),
            prestadorId,
            "dps:ler"
        );

        _robotClientRepositoryMock
            .Setup(repo => repo.ObterPorClientIdAsync(robotClient.ClientId))
            .ReturnsAsync(robotClient);

        var service = CriarAuthService();
        var request = new RobotAuthRequestDto
        {
            ClientId = robotClient.ClientId,
            ClientSecret = secret,
            Scope = "dps:criar",
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.AutenticarRoboAsync(request)
        );
    }

    [Fact]
    public async Task AutenticarRoboAsync_ComSegredoInvalido_DeveLancarUnauthorized()
    {
        // Arrange
        var prestadorId = Guid.NewGuid();
        var robotClient = new RobotClient(
            "Robo Fiscal",
            "client-app",
            BCrypt.Net.BCrypt.HashPassword("senha-correta"),
            prestadorId,
            "dps:ler"
        );

        _robotClientRepositoryMock
            .Setup(repo => repo.ObterPorClientIdAsync(robotClient.ClientId))
            .ReturnsAsync(robotClient);

        var service = CriarAuthService();
        var request = new RobotAuthRequestDto
        {
            ClientId = robotClient.ClientId,
            ClientSecret = "senha-incorreta",
            Scope = "dps:ler",
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.AutenticarRoboAsync(request)
        );
    }

    private AuthService CriarAuthService()
    {
        return new AuthService(
            _usuarioRepositoryMock.Object,
            _cryptographyService,
            _jwtSettings,
            _emailServiceMock.Object,
            _mfaSettings,
            _robotClientRepositoryMock.Object,
            _prestadorRepositoryMock.Object
        );
    }
}
