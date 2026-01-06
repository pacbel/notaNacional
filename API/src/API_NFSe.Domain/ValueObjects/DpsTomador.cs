using System;

namespace API_NFSe.Domain.ValueObjects
{
    public class DpsTomador
    {
        public string TipoDocumento { get; private set; } = string.Empty;
        public string Documento { get; private set; } = string.Empty;
        public string Nome { get; private set; } = string.Empty;
        public string? Email { get; private set; }
        public string? Telefone { get; private set; }
        public Endereco Endereco { get; private set; } = null!;

        protected DpsTomador() { }

        public DpsTomador(
            string tipoDocumento,
            string documento,
            string nome,
            string? email,
            string? telefone,
            Endereco endereco)
        {
            if (string.IsNullOrWhiteSpace(tipoDocumento))
            {
                throw new ArgumentException("O tipo de documento do tomador é obrigatório", nameof(tipoDocumento));
            }

            if (string.IsNullOrWhiteSpace(documento))
            {
                throw new ArgumentException("O documento do tomador é obrigatório", nameof(documento));
            }

            if (string.IsNullOrWhiteSpace(nome))
            {
                throw new ArgumentException("O nome do tomador é obrigatório", nameof(nome));
            }

            TipoDocumento = tipoDocumento.Trim().ToUpperInvariant();
            Documento = documento.Trim();
            Nome = nome.Trim();
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
            Telefone = string.IsNullOrWhiteSpace(telefone) ? null : telefone.Trim();
            Endereco = endereco ?? throw new ArgumentNullException(nameof(endereco));
        }
    }
}
