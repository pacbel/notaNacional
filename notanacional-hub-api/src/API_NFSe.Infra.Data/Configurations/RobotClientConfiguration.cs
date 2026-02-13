using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class RobotClientConfiguration : IEntityTypeConfiguration<RobotClient>
    {
        public void Configure(EntityTypeBuilder<RobotClient> builder)
        {
            builder.ToTable("RobotClients");

            builder.HasKey(rc => rc.Id);

            builder.Property(rc => rc.Nome)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(rc => rc.ClientId)
                .IsRequired()
                .HasMaxLength(80);

            builder.Property(rc => rc.SecretHash)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(rc => rc.Scopes)
                .HasMaxLength(500);

            builder.Property(rc => rc.Role)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(rc => rc.ClientId)
                .IsUnique();

            builder.HasOne(rc => rc.Prestador)
                .WithMany(p => p.RobotClients)
                .HasForeignKey(rc => rc.PrestadorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
