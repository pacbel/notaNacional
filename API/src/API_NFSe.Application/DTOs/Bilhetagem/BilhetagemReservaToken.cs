using System;

namespace API_NFSe.Application.DTOs.Bilhetagem
{
    public class BilhetagemReservaToken
    {
        public BilhetagemReservaToken(Guid prestadorId, Guid usuarioId, int saldoAnterior)
        {
            PrestadorId = prestadorId;
            UsuarioId = usuarioId;
            SaldoAnterior = saldoAnterior;
        }

        public Guid PrestadorId { get; }
        public Guid UsuarioId { get; }
        public int SaldoAnterior { get; }
    }
}
