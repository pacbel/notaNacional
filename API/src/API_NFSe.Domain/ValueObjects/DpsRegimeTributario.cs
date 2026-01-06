using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsRegimeTributario
    {
        public int OptanteSimplesNacional { get; private set; }
        public int RegimeEspecial { get; private set; }

        protected DpsRegimeTributario() { }

        public DpsRegimeTributario(int optanteSimplesNacional, int regimeEspecial)
        {
            if (optanteSimplesNacional < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(optanteSimplesNacional));
            }

            if (regimeEspecial < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(regimeEspecial));
            }

            OptanteSimplesNacional = optanteSimplesNacional;
            RegimeEspecial = regimeEspecial;
        }
    }
}
