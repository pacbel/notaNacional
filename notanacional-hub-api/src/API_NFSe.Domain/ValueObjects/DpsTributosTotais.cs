using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsTributosTotais
    {
        public decimal Federal { get; private set; }
        public decimal Estadual { get; private set; }
        public decimal Municipal { get; private set; }

        protected DpsTributosTotais() { }

        public DpsTributosTotais(decimal federal, decimal estadual, decimal municipal)
        {
            if (federal < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(federal), "O valor de tributos federais não pode ser negativo.");
            }

            if (estadual < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(estadual), "O valor de tributos estaduais não pode ser negativo.");
            }

            if (municipal < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(municipal), "O valor de tributos municipais não pode ser negativo.");
            }

            Federal = federal;
            Estadual = estadual;
            Municipal = municipal;
        }
    }
}
