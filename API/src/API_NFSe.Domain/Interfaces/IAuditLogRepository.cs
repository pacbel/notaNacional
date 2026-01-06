using System.Threading.Tasks;
using API_NFSe.Domain.Entities;

namespace API_NFSe.Domain.Interfaces
{
    public interface IAuditLogRepository : IRepositoryBase<AuditLog>
    {
        Task RegistrarAsync(AuditLog auditLog);
    }
}
