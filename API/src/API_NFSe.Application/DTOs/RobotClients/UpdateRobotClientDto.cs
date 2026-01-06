using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.RobotClients
{
    public class UpdateRobotClientDto
    {
        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(80)]
        public string ClientId { get; set; } = string.Empty;

        public IList<string> Scopes { get; set; } = new List<string>();

        public bool Ativo { get; set; } = true;
    }
}
