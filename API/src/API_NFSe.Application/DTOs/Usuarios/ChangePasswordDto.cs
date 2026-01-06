using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Usuarios
{
    public class ChangePasswordDto
    {
        [Required]
        [DataType(DataType.Password)]
        public string SenhaAtual { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string NovaSenha { get; set; } = string.Empty;
    }
}
