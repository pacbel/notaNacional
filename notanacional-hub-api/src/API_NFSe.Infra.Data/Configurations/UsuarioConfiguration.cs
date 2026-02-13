using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
    {
        public void Configure(EntityTypeBuilder<Usuario> builder)
        {
            builder.ToTable("Usuarios");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.NomeEncrypted)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(u => u.EmailEncrypted)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(u => u.EmailHash)
                .IsRequired()
                .HasMaxLength(128);

            builder.Property(u => u.SenhaHash)
                .IsRequired()
                .HasMaxLength(256);

            builder.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(u => u.ResetToken)
                .HasMaxLength(256);

            builder.Property(u => u.ResetTokenExpiraEm);

            builder.Property(u => u.MfaCodeHash)
                .HasMaxLength(256);

            builder.Property(u => u.MfaCodeExpiraEm);

            builder.HasIndex(u => u.EmailHash)
                .IsUnique();

            builder.HasOne(u => u.Prestador)
                .WithMany(p => p.Usuarios)
                .HasForeignKey(u => u.PrestadorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
