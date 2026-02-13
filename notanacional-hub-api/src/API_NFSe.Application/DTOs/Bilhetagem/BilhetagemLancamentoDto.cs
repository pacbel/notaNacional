using System;

namespace API_NFSe.Application.DTOs.Bilhetagem
{
    public class BilhetagemLancamentoDto
    {
        public Guid Id { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public int Quantidade { get; set; }
        public int SaldoAnterior { get; set; }
        public int SaldoPosterior { get; set; }
        public string? Observacao { get; set; }
        public Guid UsuarioResponsavelId { get; set; }
    }
}
