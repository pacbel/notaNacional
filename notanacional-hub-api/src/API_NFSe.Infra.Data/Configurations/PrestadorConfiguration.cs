using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class PrestadorConfiguration : IEntityTypeConfiguration<Prestador>
    {
        public void Configure(EntityTypeBuilder<Prestador> builder)
        {
            builder.ToTable("Prestadores");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Cnpj)
                .IsRequired()
                .HasMaxLength(14);

            builder.Property(p => p.RazaoSocial)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(p => p.NomeFantasia)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(p => p.InscricaoMunicipal)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(p => p.InscricaoEstadual)
                .HasMaxLength(20);

            builder.Property(p => p.Telefone)
                .HasMaxLength(20);

            builder.Property(p => p.Email)
                .HasMaxLength(120);

            builder.Property(p => p.Website)
                .HasMaxLength(150);

            builder.Property(p => p.CriadoPorUsuarioId)
                .IsRequired();

            builder.OwnsOne(p => p.Endereco, endereco =>
            {
                endereco.Property(e => e.Logradouro)
                    .IsRequired()
                    .HasMaxLength(150);

                endereco.Property(e => e.Numero)
                    .IsRequired()
                    .HasMaxLength(10);

                endereco.Property(e => e.Complemento)
                    .HasMaxLength(100);

                endereco.Property(e => e.Bairro)
                    .IsRequired()
                    .HasMaxLength(80);

                endereco.Property(e => e.CodigoMunicipioIbge)
                    .IsRequired()
                    .HasMaxLength(7);

                endereco.Property(e => e.Uf)
                    .HasMaxLength(2);

                endereco.Property(e => e.Cep)
                    .HasMaxLength(8);

                endereco.WithOwner();
            });

            builder.HasIndex(p => p.Cnpj)
                .IsUnique();
        }
    }
}
