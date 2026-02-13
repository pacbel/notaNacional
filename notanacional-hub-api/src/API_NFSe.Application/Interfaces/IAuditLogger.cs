using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Logs;

namespace API_NFSe.Application.Interfaces
{
    public interface IAuditLogger
    {
        Task RegistrarAsync(AuditLogEntryDto entry);
    }
}
