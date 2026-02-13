using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class BilhetagemLancamentoConfiguration : IEntityTypeConfiguration<BilhetagemLancamento>
    {
        public void Configure(EntityTypeBuilder<BilhetagemLancamento> builder)
        {
            builder.ToTable("BilhetagemLancamentos");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Quantidade)
                .IsRequired();

            builder.Property(b => b.SaldoAnterior)
                .IsRequired();

            builder.Property(b => b.SaldoPosterior)
                .IsRequired();

            builder.Property(b => b.Observacao)
                .HasMaxLength(250);

            builder.Property(b => b.UsuarioResponsavelId)
                .IsRequired();

            builder.HasOne(b => b.Prestador)
                .WithMany(p => p.BilhetagemLancamentos)
                .HasForeignKey(b => b.PrestadorId);
        }
    }
}
