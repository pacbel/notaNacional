using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsValores
    {
        public decimal ValorServico { get; private set; }
        public DpsTributos Tributos { get; private set; } = null!;

        protected DpsValores() { }

        public DpsValores(decimal valorServico, DpsTributos tributos)
        {
            if (valorServico < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(valorServico), "O valor do serviço não pode ser negativo.");
            }

            ValorServico = valorServico;
            Tributos = tributos ?? throw new ArgumentNullException(nameof(tributos));
        }
    }
}
