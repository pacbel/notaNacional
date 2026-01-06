using System.Threading.Tasks;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Infra.Data.Context;

namespace API_NFSe.Infra.Data.Repositories
{
    public class AuditLogRepository : RepositoryBase<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(ApiContext context) : base(context)
        {
        }

        public async Task RegistrarAsync(AuditLog auditLog)
        {
            await AdicionarAsync(auditLog);
            await SaveChangesAsync();
        }
    }
}
