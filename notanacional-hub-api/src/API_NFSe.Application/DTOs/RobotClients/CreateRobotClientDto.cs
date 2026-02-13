using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.RobotClients
{
    public class CreateRobotClientDto
    {
        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(80)]
        public string? ClientId { get; set; }

        public bool GerarClientIdAutomatico { get; set; } = true;

        [StringLength(256, MinimumLength = 16)]
        public string? Secret { get; set; }

        public bool GerarSecretAutomatico { get; set; } = true;

        public IList<string> Scopes { get; set; } = new List<string>();
    }
}
