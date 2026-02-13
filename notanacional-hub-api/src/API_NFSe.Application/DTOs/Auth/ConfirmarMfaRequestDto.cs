using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Auth
{
    public class ConfirmarMfaRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(10, MinimumLength = 4)]
        public string Codigo { get; set; } = string.Empty;
    }
}
