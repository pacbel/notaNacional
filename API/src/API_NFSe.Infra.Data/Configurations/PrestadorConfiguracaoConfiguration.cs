using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class PrestadorConfiguracaoConfiguration : IEntityTypeConfiguration<PrestadorConfiguracao>
    {
        public void Configure(EntityTypeBuilder<PrestadorConfiguracao> builder)
        {
            builder.ToTable("PrestadorConfiguracoes");

            builder.HasKey(pc => pc.Id);

            builder.Property(pc => pc.VersaoAplicacao)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(pc => pc.AtualizadoPorUsuarioId)
                .IsRequired();

            builder.Property(pc => pc.SmtpHost)
                .HasMaxLength(255);

            builder.Property(pc => pc.SmtpPort);

            builder.Property(pc => pc.SmtpUser)
                .HasMaxLength(150);

            builder.Property(pc => pc.SmtpPasswordEncrypted)
                .HasMaxLength(512);

            builder.Property(pc => pc.SmtpFrom)
                .HasMaxLength(150);

            builder.Property(pc => pc.SmtpFromName)
                .HasMaxLength(150);

            builder.Property(pc => pc.SmtpResetPasswordUrl)
                .HasMaxLength(255);

            builder.HasIndex(pc => pc.PrestadorId)
                .IsUnique();

            builder.HasOne(pc => pc.Prestador)
                .WithOne(p => p.Configuracao)
                .HasForeignKey<PrestadorConfiguracao>(pc => pc.PrestadorId);
        }
    }
}
