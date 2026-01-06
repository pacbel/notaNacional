using System.Collections.Generic;

namespace API_NFSe.Application.DTOs.Nfse
{
    public sealed class ListarNotasEmitidasResponseDto
    {
        public List<NotaEmitidaDto> Items { get; set; } = new();
        public int Total { get; set; }
    }

    public sealed class NotaEmitidaDto
    {
        public string PrestadorId { get; set; } = string.Empty;
        public string PrestadorNome { get; set; } = string.Empty;
        public string ChaveAcesso { get; set; } = string.Empty;
        public string? Numero { get; set; }
        public string Situacao { get; set; } = string.Empty;
        public string? EmitidaEm { get; set; }
    }
}
