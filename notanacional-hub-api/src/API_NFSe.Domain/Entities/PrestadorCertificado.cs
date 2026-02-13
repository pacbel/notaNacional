using System;
using System.ComponentModel.DataAnnotations.Schema;
using API_NFSe.Domain.Common;

namespace API_NFSe.Domain.Entities
{
    public class PrestadorCertificado : EntityBase
    {
        public const string TipoArmazenamentoFileSystem = "FileSystem";

        public Guid PrestadorId { get; private set; }
        public Prestador Prestador { get; private set; } = null!;

        public string Alias { get; private set; } = string.Empty;
        public string TipoArmazenamento { get; private set; } = string.Empty;

        [Column("DadosCertificado")]
        public string CaminhoRelativo { get; private set; } = string.Empty;

        public string HashConteudo { get; private set; } = string.Empty;
        public long TamanhoBytes { get; private set; }
        public string? SenhaProtegida { get; private set; }
        public DateTime DataValidade { get; private set; }
        public Guid AtualizadoPorUsuarioId { get; private set; }

        public string Thumbprint { get; private set; } = string.Empty;
        public string CommonName { get; private set; } = string.Empty;
        public string Subject { get; private set; } = string.Empty;
        public string Issuer { get; private set; } = string.Empty;
        public string Cnpj { get; private set; } = string.Empty;
        public DateTime NotBefore { get; private set; }
        public DateTime NotAfter { get; private set; }
        public DateTime DataEnvio { get; private set; }

        protected PrestadorCertificado() { }

        public PrestadorCertificado(
            Guid prestadorId,
            string alias,
            string caminhoRelativo,
            string hashConteudo,
            long tamanhoBytes,
            string? senhaProtegida,
            DateTime notBefore,
            DateTime notAfter,
            string thumbprint,
            string commonName,
            string subject,
            string issuer,
            string cnpj,
            Guid atualizadoPorUsuarioId,
            DateTime dataEnvioUtc)
        {
            if (string.IsNullOrWhiteSpace(alias))
            {
                throw new ArgumentException("O alias do certificado é obrigatório", nameof(alias));
            }

            if (string.IsNullOrWhiteSpace(caminhoRelativo))
            {
                throw new ArgumentException("O caminho do certificado é obrigatório", nameof(caminhoRelativo));
            }

            if (string.IsNullOrWhiteSpace(hashConteudo))
            {
                throw new ArgumentException("O hash do certificado é obrigatório", nameof(hashConteudo));
            }

            if (string.IsNullOrWhiteSpace(thumbprint))
            {
                throw new ArgumentException("A impressão digital do certificado é obrigatória", nameof(thumbprint));
            }

            if (string.IsNullOrWhiteSpace(cnpj))
            {
                throw new ArgumentException("O CNPJ associado ao certificado é obrigatório", nameof(cnpj));
            }

            PrestadorId = prestadorId;
            Alias = alias.Trim();
            TipoArmazenamento = TipoArmazenamentoFileSystem;
            CaminhoRelativo = caminhoRelativo.Trim();
            HashConteudo = hashConteudo.Trim();
            TamanhoBytes = tamanhoBytes;
            SenhaProtegida = string.IsNullOrWhiteSpace(senhaProtegida) ? null : senhaProtegida;
            NotBefore = notBefore;
            NotAfter = notAfter;
            Thumbprint = thumbprint.Trim();
            CommonName = string.IsNullOrWhiteSpace(commonName) ? string.Empty : commonName.Trim();
            Subject = string.IsNullOrWhiteSpace(subject) ? string.Empty : subject.Trim();
            Issuer = string.IsNullOrWhiteSpace(issuer) ? string.Empty : issuer.Trim();
            Cnpj = cnpj.Trim();
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;
            DataEnvio = dataEnvioUtc;
            DataValidade = NotAfter;
        }

        public void AtualizarAlias(string alias, Guid usuarioId)
        {
            if (!string.IsNullOrWhiteSpace(alias))
            {
                Alias = alias.Trim();
            }

            AtualizadoPorUsuarioId = usuarioId;
            AtualizarDataAtualizacao();
        }

        public void AtualizarSenha(string? senhaProtegida, Guid usuarioId)
        {
            SenhaProtegida = string.IsNullOrWhiteSpace(senhaProtegida) ? null : senhaProtegida;
            AtualizadoPorUsuarioId = usuarioId;
            AtualizarDataAtualizacao();
        }

        public void AtualizarArquivo(
            string caminhoRelativo,
            string hashConteudo,
            long tamanhoBytes,
            DateTime notBefore,
            DateTime notAfter,
            string thumbprint,
            string commonName,
            string subject,
            string issuer,
            string cnpj,
            DateTime dataEnvioUtc,
            Guid usuarioId)
        {
            if (string.IsNullOrWhiteSpace(caminhoRelativo))
            {
                throw new ArgumentException("O caminho do certificado é obrigatório", nameof(caminhoRelativo));
            }

            if (string.IsNullOrWhiteSpace(hashConteudo))
            {
                throw new ArgumentException("O hash do certificado é obrigatório", nameof(hashConteudo));
            }

            if (string.IsNullOrWhiteSpace(thumbprint))
            {
                throw new ArgumentException("A impressão digital do certificado é obrigatória", nameof(thumbprint));
            }

            if (string.IsNullOrWhiteSpace(cnpj))
            {
                throw new ArgumentException("O CNPJ associado ao certificado é obrigatório", nameof(cnpj));
            }

            CaminhoRelativo = caminhoRelativo.Trim();
            HashConteudo = hashConteudo.Trim();
            TamanhoBytes = tamanhoBytes;
            NotBefore = notBefore;
            NotAfter = notAfter;
            Thumbprint = thumbprint.Trim();
            CommonName = string.IsNullOrWhiteSpace(commonName) ? string.Empty : commonName.Trim();
            Subject = string.IsNullOrWhiteSpace(subject) ? string.Empty : subject.Trim();
            Issuer = string.IsNullOrWhiteSpace(issuer) ? string.Empty : issuer.Trim();
            Cnpj = cnpj.Trim();
            DataEnvio = dataEnvioUtc;
            DataValidade = NotAfter;
            AtualizadoPorUsuarioId = usuarioId;
            AtualizarDataAtualizacao();
        }
    }
}
