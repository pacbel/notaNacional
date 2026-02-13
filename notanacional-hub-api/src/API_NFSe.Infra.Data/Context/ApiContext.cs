using API_NFSe.Domain.Entities;
using API_NFSe.Infra.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace API_NFSe.Infra.Data.Context
{
    public class ApiContext : DbContext
    {
        public ApiContext(DbContextOptions<ApiContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Prestador> Prestadores { get; set; }
        public DbSet<RobotClient> RobotClients { get; set; }
        public DbSet<PrestadorConfiguracao> PrestadorConfiguracoes { get; set; }
        public DbSet<PrestadorCertificado> PrestadorCertificados { get; set; }
        public DbSet<Dps> Dps { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<BilhetagemLancamento> BilhetagemLancamentos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.UseCollation("utf8mb4_general_ci");
            
            // Aplica as configurações de mapeamento
            modelBuilder.ApplyConfiguration(new UsuarioConfiguration());
            modelBuilder.ApplyConfiguration(new PrestadorConfiguration());
            modelBuilder.ApplyConfiguration(new PrestadorConfiguracaoConfiguration());
            modelBuilder.ApplyConfiguration(new PrestadorCertificadoConfiguration());
            modelBuilder.ApplyConfiguration(new DpsConfiguration());
            modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
            modelBuilder.ApplyConfiguration(new RobotClientConfiguration());
            modelBuilder.ApplyConfiguration(new BilhetagemLancamentoConfiguration());

            // Desabilita o delete em cascata
            foreach (var relationship in modelBuilder.Model
                         .GetEntityTypes()
                         .SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.Restrict;
            }

            base.OnModelCreating(modelBuilder);
        }
    }
}
