using System;

namespace API_NFSe.Application.DTOs.Prestadores
{
    public class PrestadorCertificadoDto
    {
        public Guid Id { get; set; }
        public string Alias { get; set; } = string.Empty;
        public string TipoArmazenamento { get; set; } = string.Empty;
        public DateTime DataValidade { get; set; }
        public Guid AtualizadoPorUsuarioId { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
    }
}
