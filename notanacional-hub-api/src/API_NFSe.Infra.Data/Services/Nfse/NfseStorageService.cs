using System;
using System.IO;
using System.Text;
using System.Text.Json;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class NfseStorageService : INfseStorageService
    {
        private readonly string _baseDirectory;
        private readonly string _jsonDirectory;
        private readonly string _xmlDirectory;
        private readonly string _logsDirectory;

        public NfseStorageService()
        {
            _baseDirectory = Path.Combine(AppContext.BaseDirectory, "Data", "NFSe");
            _jsonDirectory = Path.Combine(_baseDirectory, "json");
            _xmlDirectory = Path.Combine(_baseDirectory, "xml");
            _logsDirectory = Path.Combine(_baseDirectory, "logs");
            EnsureDirectories();
        }

        public string SaveContent(byte[] content, string contentType, string direction)
        {
            EnsureDirectories();
            Directory.CreateDirectory(_logsDirectory);
            var id = Guid.NewGuid().ToString("N");
            var stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmssfff");
            var safeDir = direction?.Equals("response", StringComparison.OrdinalIgnoreCase) == true ? "resp" : "req";
            var extension = GuessExtension(contentType);
            var filePath = Path.Combine(_logsDirectory, $"{stamp}_{safeDir}_{id}{extension}");
            File.WriteAllBytes(filePath, content ?? Array.Empty<byte>());
            File.WriteAllText(filePath + ".meta.txt", $"utc={DateTime.UtcNow:O}\ncontentType={contentType}\nlength={content?.Length ?? 0}", new UTF8Encoding(false));
            return id;
        }

        public void SaveStructuredLog(string direction, string url, int ambiente, string? certificateSuffix, string contentType, int statusCode, string contentId)
        {
            EnsureDirectories();
            Directory.CreateDirectory(_logsDirectory);
            var stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmssfff");
            var safeDirection = direction?.Equals("response", StringComparison.OrdinalIgnoreCase) == true ? "resp" : "req";
            var payload = new
            {
                utc = DateTime.UtcNow.ToString("O"),
                direction = safeDirection,
                ambiente,
                certificateSuffix,
                url,
                contentType,
                statusCode,
                contentId
            };
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
            var filePath = Path.Combine(_logsDirectory, $"{stamp}_{safeDirection}_{contentId}.json");
            File.WriteAllText(filePath, json, new UTF8Encoding(false));
        }

        public void SaveEmitResponse(string? chaveAcesso, string? numero, string? xmlNfse, string? nfseBase64)
        {
            EnsureDirectories();
            var stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmssfff");
            var safeKey = SafeFileFragment(chaveAcesso);
            var safeNumero = SafeFileFragment(numero);
            var fileName = string.IsNullOrWhiteSpace(safeKey) ? (string.IsNullOrWhiteSpace(safeNumero) ? stamp : safeNumero + "_" + stamp) : safeKey + "_" + stamp;

            if (!string.IsNullOrWhiteSpace(xmlNfse))
            {
                var xmlPath = Path.Combine(_xmlDirectory, fileName + ".xml");
                File.WriteAllText(xmlPath, xmlNfse, new UTF8Encoding(false));
            }

            if (!string.IsNullOrWhiteSpace(nfseBase64))
            {
                var jsonPath = Path.Combine(_jsonDirectory, fileName + ".json");
                var payload = new { chaveAcesso = chaveAcesso, numero = numero, nfseBase64 };
                var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(jsonPath, json, new UTF8Encoding(false));
            }
        }

        private void EnsureDirectories()
        {
            Directory.CreateDirectory(_baseDirectory);
            Directory.CreateDirectory(_jsonDirectory);
            Directory.CreateDirectory(_xmlDirectory);
            Directory.CreateDirectory(_logsDirectory);
        }

        private static string SafeFileFragment(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            foreach (var invalid in Path.GetInvalidFileNameChars())
            {
                value = value.Replace(invalid, '_');
            }

            return value.Trim();
        }

        private static string GuessExtension(string contentType)
        {
            var ct = (contentType ?? string.Empty).ToLowerInvariant();
            if (ct.Contains("xml")) return ".xml";
            if (ct.Contains("json")) return ".json";
            if (ct.Contains("gzip") || ct.Contains("x-gzip")) return ".gz";
            if (ct.Contains("octet-stream")) return ".bin";
            return ".bin";
        }
    }
}
