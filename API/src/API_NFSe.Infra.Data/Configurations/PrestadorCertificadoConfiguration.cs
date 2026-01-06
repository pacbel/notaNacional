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

            builder.Property(pc => pc.DadosCertificado)
                .IsRequired();

            builder.Property(pc => pc.SenhaProtegida)
                .HasMaxLength(512);

            builder.Property(pc => pc.DataValidade)
                .IsRequired();

            builder.Property(pc => pc.AtualizadoPorUsuarioId)
                .IsRequired();

            builder.HasOne(pc => pc.Prestador)
                .WithMany(p => p.Certificados)
                .HasForeignKey(pc => pc.PrestadorId);
        }
    }
}
