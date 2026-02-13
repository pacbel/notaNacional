using System;

namespace API_NFSe.Domain.Common
{
    public abstract class EntityBase
    {
        public Guid Id { get; protected set; }
        public DateTime DataCriacao { get; protected set; }
        public DateTime? DataAtualizacao { get; protected set; }
        public bool Ativo { get; protected set; }

        protected EntityBase()
        {
            Id = Guid.NewGuid();
            DataCriacao = DateTime.UtcNow;
            Ativo = true;
        }

        public void AtualizarDataAtualizacao()
        {
            DataAtualizacao = DateTime.UtcNow;
        }

        public void Desativar()
        {
            Ativo = false;
            AtualizarDataAtualizacao();
        }

        public void Ativar()
        {
            Ativo = true;
            AtualizarDataAtualizacao();
        }
    }
}
