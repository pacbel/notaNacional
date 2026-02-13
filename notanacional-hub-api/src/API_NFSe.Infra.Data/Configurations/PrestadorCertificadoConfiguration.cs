using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class PrestadorCertificadoConfiguration : IEntityTypeConfiguration<PrestadorCertificado>
    {
        public void Configure(EntityTypeBuilder<PrestadorCertificado> builder)
        {
            builder.ToTable("PrestadorCertificados");

            builder.HasKey(pc => pc.Id);

            builder.Property(pc => pc.Alias)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(pc => pc.TipoArmazenamento)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(pc => pc.CaminhoRelativo)
                .IsRequired()
                .HasMaxLength(260);

            builder.Property(pc => pc.HashConteudo)
                .IsRequired()
                .HasMaxLength(128);

            builder.Property(pc => pc.TamanhoBytes)
                .IsRequired();

            builder.Property(pc => pc.SenhaProtegida)
                .HasMaxLength(512);

            builder.Property(pc => pc.DataValidade)
                .IsRequired();

            builder.Property(pc => pc.AtualizadoPorUsuarioId)
                .IsRequired();

            builder.Property(pc => pc.Thumbprint)
                .IsRequired()
                .HasMaxLength(128);

            builder.Property(pc => pc.CommonName)
                .HasMaxLength(150);

            builder.Property(pc => pc.Subject)
                .HasMaxLength(512);

            builder.Property(pc => pc.Issuer)
                .HasMaxLength(512);

            builder.Property(pc => pc.Cnpj)
                .IsRequired()
                .HasMaxLength(14);

            builder.Property(pc => pc.NotBefore)
                .IsRequired();

            builder.Property(pc => pc.NotAfter)
                .IsRequired();

            builder.Property(pc => pc.DataEnvio)
                .IsRequired();

            builder.HasOne(pc => pc.Prestador)
                .WithMany(p => p.Certificados)
                .HasForeignKey(pc => pc.PrestadorId);

            builder.HasIndex(pc => pc.Thumbprint)
                .IsUnique();

            builder.HasIndex(pc => new { pc.PrestadorId, pc.Cnpj, pc.Thumbprint })
                .IsUnique();

            builder.HasIndex(pc => pc.CaminhoRelativo)
                .IsUnique();

            builder.HasIndex(pc => pc.Alias);

            builder.Property(pc => pc.Ativo)
                .HasDefaultValue(true);
        }
    }
}
