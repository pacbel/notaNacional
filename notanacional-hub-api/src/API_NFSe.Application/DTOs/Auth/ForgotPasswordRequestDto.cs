using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Auth
{
    public class ForgotPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string FrontendUrl { get; set; } = string.Empty;

    }
}
