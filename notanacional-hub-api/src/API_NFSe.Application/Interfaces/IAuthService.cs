using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Auth;

namespace API_NFSe.Application.Interfaces
{
    public interface IAuthService
    {
        Task<MfaChallengeResponseDto> LoginAsync(LoginRequestDto dto);
        Task<AuthResponseDto> ConfirmarMfaAsync(ConfirmarMfaRequestDto dto);
        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto);
        Task RevogarRefreshTokenAsync(string refreshToken);
        Task<AuthResponseDto> AutenticarRoboAsync(RobotAuthRequestDto dto);
    }
}
