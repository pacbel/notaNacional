using System;

namespace API_NFSe.Application.DTOs.Bilhetagem
{
    public class BilhetagemSaldoDto
    {
        public bool BilhetagemHabilitada { get; set; }
        public int? CreditoMensalPadrao { get; set; }
        public int SaldoNotasDisponiveis { get; set; }
        public DateTime? CompetenciaSaldo { get; set; }
    }
}
