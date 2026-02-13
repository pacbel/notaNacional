using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Auth
{
    public class RobotAuthRequestDto
    {
        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public string ClientSecret { get; set; } = string.Empty;

        public string? Scope { get; set; }
    }
}
