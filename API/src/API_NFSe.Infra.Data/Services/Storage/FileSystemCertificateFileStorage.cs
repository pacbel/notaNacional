using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using API_NFSe.Application.Configurations;
using API_NFSe.Application.Interfaces;

namespace API_NFSe.Infra.Data.Services.Storage;

public sealed class FileSystemCertificateFileStorage : ICertificateFileStorage
{
    private readonly string _basePath;

    public FileSystemCertificateFileStorage(CertificateStorageSettings settings)
    {
        if (settings is null)
        {
            throw new ArgumentNullException(nameof(settings));
        }

        if (string.IsNullOrWhiteSpace(settings.BasePath))
        {
            throw new InvalidOperationException("O caminho base para armazenamento de certificados não foi configurado.");
        }

        _basePath = Path.GetFullPath(settings.BasePath);
        Directory.CreateDirectory(_basePath);
    }

    public async Task SaveAsync(string relativePath, byte[] content, CancellationToken cancellationToken)
    {
        if (content is null || content.Length == 0)
        {
            throw new ArgumentException("O conteúdo do certificado é obrigatório.", nameof(content));
        }

        var targetPath = ResolvePath(relativePath);
        var directory = Path.GetDirectoryName(targetPath);
        if (directory is null)
        {
            throw new InvalidOperationException("Não foi possível determinar o diretório de destino para o certificado.");
        }

        Directory.CreateDirectory(directory);
        await File.WriteAllBytesAsync(targetPath, content, cancellationToken);
    }

    public async Task<byte[]> ReadAsync(string relativePath, CancellationToken cancellationToken)
    {
        var targetPath = ResolvePath(relativePath);
        if (!File.Exists(targetPath))
        {
            throw new FileNotFoundException("Certificado não encontrado no armazenamento local.", targetPath);
        }

        return await File.ReadAllBytesAsync(targetPath, cancellationToken);
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken)
    {
        var targetPath = ResolvePath(relativePath);
        if (File.Exists(targetPath))
        {
            File.Delete(targetPath);
        }

        return Task.CompletedTask;
    }

    public string BuildRelativePath(string cnpj, string fileName)
    {
        var sanitizedCnpj = SomenteDigitos(cnpj);
        if (string.IsNullOrWhiteSpace(sanitizedCnpj))
        {
            throw new ArgumentException("CNPJ inválido para armazenar certificado.", nameof(cnpj));
        }

        var sanitizedFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(sanitizedFileName))
        {
            throw new ArgumentException("Nome de arquivo inválido.", nameof(fileName));
        }

        return Path.Combine(sanitizedCnpj, sanitizedFileName);
    }

    private string ResolvePath(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException("Caminho relativo inválido.", nameof(relativePath));
        }

        var cleaned = relativePath.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var combined = Path.Combine(_basePath, cleaned);
        var fullPath = Path.GetFullPath(combined);
        if (!fullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Tentativa de acesso a caminho fora do diretório de certificados.");
        }

        return fullPath;
    }

    private static string SomenteDigitos(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            return string.Empty;
        }

        var buffer = new char[valor.Length];
        var index = 0;
        foreach (var caractere in valor)
        {
            if (char.IsDigit(caractere))
            {
                buffer[index++] = caractere;
            }
        }

        return index == 0 ? string.Empty : new string(buffer, 0, index);
    }
}
