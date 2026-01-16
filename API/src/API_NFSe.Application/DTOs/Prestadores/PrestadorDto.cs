using System;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class PrestadorDto
    {
        public Guid Id { get; set; }
        public string Cnpj { get; set; } = string.Empty;
        public string RazaoSocial { get; set; } = string.Empty;
        public string NomeFantasia { get; set; } = string.Empty;
        public string InscricaoMunicipal { get; set; } = string.Empty;
        public string? InscricaoEstadual { get; set; }
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }
        public EnderecoDto Endereco { get; set; } = new();
        public Guid CriadoPorUsuarioId { get; set; }
        public Guid? AtualizadoPorUsuarioId { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public PrestadorConfiguracaoDto? Configuracao { get; set; }
    }
}
