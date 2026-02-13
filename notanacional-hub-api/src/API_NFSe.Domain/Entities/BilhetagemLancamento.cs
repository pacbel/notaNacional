using System;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class BilhetagemLancamento : EntityBase
    {
        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;
        public int Quantidade { get; private set; }
        public int SaldoAnterior { get; private set; }
        public int SaldoPosterior { get; private set; }
        public string? Observacao { get; private set; }
        public Guid UsuarioResponsavelId { get; private set; }

        protected BilhetagemLancamento() { }

        public BilhetagemLancamento(Guid prestadorId, int quantidade, int saldoAnterior, int saldoPosterior, Guid usuarioResponsavelId, string? observacao = null)
        {
            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            PrestadorId = prestadorId;
            Quantidade = quantidade;
            SaldoAnterior = saldoAnterior;
            SaldoPosterior = saldoPosterior;
            UsuarioResponsavelId = usuarioResponsavelId;
            Observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim();
        }

        public void DefinirPrestador(Prestador prestador)
        {
            Prestador = prestador ?? throw new ArgumentNullException(nameof(prestador));
            PrestadorId = prestador.Id;
        }
    }
}
