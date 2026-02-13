using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Usuarios
{
    public class CreateUsuarioDto
    {
        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Senha { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = "User";

        public Guid? PrestadorId { get; set; }
    }
}
