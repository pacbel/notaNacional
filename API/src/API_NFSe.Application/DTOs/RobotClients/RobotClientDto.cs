using System;
using System.Collections.Generic;

namespace API_NFSe.Application.DTOs.RobotClients
{
    public class RobotClientDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string Role { get; set; } = "Robot";
        public Guid PrestadorId { get; set; }
        public string PrestadorNome { get; set; } = string.Empty;
        public string PrestadorCnpj { get; set; } = string.Empty;
        public IList<string> Scopes { get; set; } = new List<string>();
        public bool Ativo { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public string? SecretGerado { get; set; }
    }
}
