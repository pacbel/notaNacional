using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace API_NFSe.Application.Interfaces;

public interface ICertificateFileStorage
{
    Task SaveAsync(string relativePath, byte[] content, CancellationToken cancellationToken);
    Task<byte[]> ReadAsync(string relativePath, CancellationToken cancellationToken);
    Task DeleteAsync(string relativePath, CancellationToken cancellationToken);
    string BuildRelativePath(string cnpj, string fileName);
}
