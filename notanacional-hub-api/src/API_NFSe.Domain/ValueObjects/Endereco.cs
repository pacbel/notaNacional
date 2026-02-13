using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class Endereco
    {
        public string Logradouro { get; private set; } = string.Empty;
        public string Numero { get; private set; } = string.Empty;
        public string? Complemento { get; private set; }
        public string Bairro { get; private set; } = string.Empty;
        public string CodigoMunicipioIbge { get; private set; } = string.Empty;
        public string? Uf { get; private set; }
        public string? Cep { get; private set; }

        protected Endereco() { }

        public Endereco(
            string logradouro,
            string numero,
            string? complemento,
            string bairro,
            string codigoMunicipioIbge,
            string? uf,
            string? cep)
        {
            if (string.IsNullOrWhiteSpace(logradouro))
            {
                throw new ArgumentException("O logradouro é obrigatório", nameof(logradouro));
            }

            if (string.IsNullOrWhiteSpace(numero))
            {
                throw new ArgumentException("O número é obrigatório", nameof(numero));
            }

            if (string.IsNullOrWhiteSpace(bairro))
            {
                throw new ArgumentException("O bairro é obrigatório", nameof(bairro));
            }

            if (string.IsNullOrWhiteSpace(codigoMunicipioIbge))
            {
                throw new ArgumentException("O código do município (IBGE) é obrigatório", nameof(codigoMunicipioIbge));
            }

            Logradouro = logradouro.Trim();
            Numero = numero.Trim();
            Complemento = string.IsNullOrWhiteSpace(complemento) ? null : complemento.Trim();
            Bairro = bairro.Trim();
            CodigoMunicipioIbge = codigoMunicipioIbge.Trim();
            Uf = string.IsNullOrWhiteSpace(uf) ? null : uf.Trim().ToUpperInvariant();
            Cep = string.IsNullOrWhiteSpace(cep) ? null : cep.Trim();
        }

        public void Atualizar(
            string logradouro,
            string numero,
            string? complemento,
            string bairro,
            string codigoMunicipioIbge,
            string? uf,
            string? cep)
        {
            Logradouro = string.IsNullOrWhiteSpace(logradouro) ? Logradouro : logradouro.Trim();
            Numero = string.IsNullOrWhiteSpace(numero) ? Numero : numero.Trim();
            Complemento = string.IsNullOrWhiteSpace(complemento) ? null : complemento.Trim();
            Bairro = string.IsNullOrWhiteSpace(bairro) ? Bairro : bairro.Trim();
            CodigoMunicipioIbge = string.IsNullOrWhiteSpace(codigoMunicipioIbge)
                ? CodigoMunicipioIbge
                : codigoMunicipioIbge.Trim();
            Uf = string.IsNullOrWhiteSpace(uf) ? null : uf.Trim().ToUpperInvariant();
            Cep = string.IsNullOrWhiteSpace(cep) ? null : cep.Trim();
        }
    }
}
