using API_NFSe.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API_NFSe.Infra.Data.Configurations
{
    public class DpsConfiguration : IEntityTypeConfiguration<Dps>
    {
        public void Configure(EntityTypeBuilder<Dps> builder)
        {
            builder.ToTable("Dps");

            builder.HasKey(d => d.Id);

            builder.Property(d => d.Versao)
                .IsRequired()
                .HasMaxLength(5);

            builder.Property(d => d.Identificador)
                .IsRequired()
                .HasMaxLength(60);

            builder.Property(d => d.VersaoAplicacao)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(d => d.Serie)
                .IsRequired()
                .HasMaxLength(5);

            builder.Property(d => d.NumeroDps)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(d => d.CodigoLocalEmissao)
                .IsRequired()
                .HasMaxLength(7);

            builder.Property(d => d.XmlAssinado)
                .IsRequired();

            builder.Property(d => d.JsonEntrada)
                .IsRequired();

            builder.Property(d => d.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(d => d.Protocolo)
                .HasMaxLength(50);

            builder.Property(d => d.MensagemErro)
                .HasMaxLength(1000);

            builder.Property(d => d.DigestValue)
                .HasMaxLength(256);

            builder.HasIndex(d => new { d.PrestadorId, d.Identificador })
                .IsUnique();

            builder.HasOne(d => d.Prestador)
                .WithMany(p => p.Dps)
                .HasForeignKey(d => d.PrestadorId);

            builder.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId);

            builder.OwnsOne(d => d.RegimeTributario, rt =>
            {
                rt.Property(r => r.OptanteSimplesNacional).IsRequired();
                rt.Property(r => r.RegimeEspecial).IsRequired();
                rt.WithOwner();
            });

            builder.OwnsOne(d => d.Tomador, tomador =>
            {
                tomador.Property(t => t.TipoDocumento)
                    .IsRequired()
                    .HasMaxLength(5);

                tomador.Property(t => t.Documento)
                    .IsRequired()
                    .HasMaxLength(14);

                tomador.Property(t => t.Nome)
                    .IsRequired()
                    .HasMaxLength(150);

                tomador.Property(t => t.Email)
                    .HasMaxLength(120);

                tomador.Property(t => t.Telefone)
                    .HasMaxLength(20);

                tomador.OwnsOne(t => t.Endereco, endereco =>
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
            });

            builder.OwnsOne(d => d.Servico, servico =>
            {
                servico.Property(s => s.CodigoLocalPrestacao)
                    .IsRequired()
                    .HasMaxLength(7);

                servico.Property(s => s.CodigoTributacaoNacional)
                    .IsRequired()
                    .HasMaxLength(10);

                servico.Property(s => s.CodigoTributacaoMunicipal)
                    .IsRequired()
                    .HasMaxLength(10);

                servico.Property(s => s.DescricaoServico)
                    .IsRequired()
                    .HasMaxLength(255);

                servico.Property(s => s.InformacoesComplementares)
                    .HasMaxLength(1024);

                servico.WithOwner();
            });

            builder.OwnsOne(d => d.Valores, valores =>
            {
                valores.Property(v => v.ValorServico)
                    .IsRequired()
                    .HasColumnType("decimal(18,2)");

                valores.OwnsOne(v => v.Tributos, tributos =>
                {
                    tributos.Property(t => t.IssRetido).IsRequired();
                    tributos.Property(t => t.TipoRetencaoIss).IsRequired();

                    tributos.OwnsOne(t => t.Totais, totais =>
                    {
                        totais.Property(tt => tt.Federal)
                            .IsRequired()
                            .HasColumnType("decimal(18,2)");

                        totais.Property(tt => tt.Estadual)
                            .IsRequired()
                            .HasColumnType("decimal(18,2)");

                        totais.Property(tt => tt.Municipal)
                            .IsRequired()
                            .HasColumnType("decimal(18,2)");

                        totais.WithOwner();
                    });

                    tributos.WithOwner();
                });

                valores.WithOwner();
            });
        }
    }
}
