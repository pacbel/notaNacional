using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.UsuarioNome)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(x => x.Email)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(x => x.Metodo)
                .HasMaxLength(10)
                .IsRequired();

            builder.Property(x => x.Rota)
                .HasMaxLength(512)
                .IsRequired();

            builder.Property(x => x.Acao)
                .HasMaxLength(256)
                .IsRequired();

            builder.Property(x => x.Ip)
                .HasMaxLength(45)
                .IsRequired();

            builder.Property(x => x.Payload)
                .HasColumnType("longtext");

            builder.Property(x => x.StatusCode)
                .IsRequired();

            builder.Property(x => x.DataHora)
                .HasColumnType("datetime(6)")
                .IsRequired();

            builder.Property(x => x.DataCriacao)
                .HasColumnType("datetime(6)")
                .IsRequired();

            builder.Property(x => x.DataAtualizacao)
                .HasColumnType("datetime(6)");

            builder.Property(x => x.Ativo)
                .HasDefaultValue(true)
                .IsRequired();
        }
    }
}
