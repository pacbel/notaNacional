using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.RobotClients
{
    public class RotateRobotClientSecretDto
    {
        [Required]
        [StringLength(256, MinimumLength = 16)]
        public string NovoSecret { get; set; } = string.Empty;
    }
}
