using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsTributos
    {
        public int IssRetido { get; private set; }
        public int TipoRetencaoIss { get; private set; }
        public DpsTributosTotais Totais { get; private set; } = null!;

        protected DpsTributos() { }

        public DpsTributos(int issRetido, int tipoRetencaoIss, DpsTributosTotais totais)
        {
            if (issRetido < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(issRetido));
            }

            if (tipoRetencaoIss < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(tipoRetencaoIss));
            }

            IssRetido = issRetido;
            TipoRetencaoIss = tipoRetencaoIss;
            Totais = totais ?? throw new ArgumentNullException(nameof(totais));
        }
    }
}
