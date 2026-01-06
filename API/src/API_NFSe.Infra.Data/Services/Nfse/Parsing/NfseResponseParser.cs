using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Xml;
using API_NFSe.Application.DTOs.Nfse;

namespace API_NFSe.Infra.Data.Services.Nfse.Parsing
{
    public sealed class NfseResponseParser : INfseResponseParser
    {
        public EmitirNfseResponseDto ParseEmitirResponse(int statusCode, string contentType, byte[] content)
        {
            var text = TryGetText(content);
            string? nfseBase64 = null;
            string? xmlNfse = null;
            string? chaveAcesso = null;
            string? numero = null;
            string? codigoVerificacao = null;
            string? urlNfse = null;

            if (IsJson(contentType) || LooksLikeJson(text))
            {
                try
                {
                    using var document = JsonDocument.Parse(text);
                    var root = document.RootElement;
                    if (root.TryGetProperty("nfseXmlGZipB64", out var nfseProp))
                    {
                        nfseBase64 = nfseProp.GetString();
                        if (!string.IsNullOrWhiteSpace(nfseBase64))
                        {
                            xmlNfse = TryInflateFromBase64(nfseBase64);
                        }
                    }

                    if (root.TryGetProperty("chaveAcesso", out var chaveProp))
                    {
                        chaveAcesso = chaveProp.GetString();
                    }

                    if (root.TryGetProperty("numero", out var numeroProp))
                    {
                        numero = numeroProp.GetString();
                    }

                    if (root.TryGetProperty("codigoVerificacao", out var codProp))
                    {
                        codigoVerificacao = codProp.GetString();
                    }

                    if (root.TryGetProperty("urlNfse", out var urlProp))
                    {
                        urlNfse = urlProp.GetString();
                    }
                }
                catch
                {
                    // Ignora parsing JSON inválido, mantendo valores padrões.
                }
            }
            else if (LooksLikeBase64(text))
            {
                nfseBase64 = text;
                xmlNfse = TryInflateFromBase64(text);
            }

            if (!string.IsNullOrWhiteSpace(xmlNfse))
            {
                try
                {
                    var doc = new XmlDocument { PreserveWhitespace = true };
                    doc.LoadXml(xmlNfse);
                    chaveAcesso ??= FirstInnerText(doc, "//ChaveAcesso", "//chaveAcesso", "//IdentificacaoNfse/ChaveAcesso");
                    numero ??= FirstInnerText(doc, "//Numero", "//numero", "//IdentificacaoNfse/Numero");
                    codigoVerificacao ??= FirstInnerText(doc, "//CodigoVerificacao", "//codigoVerificacao");
                    urlNfse ??= FirstInnerText(doc, "//UrlNfse", "//urlNfse", "//LinkImpressao", "//linkImpressao");
                }
                catch
                {
                    // Mantém fallback, caso o XML seja inválido.
                }
            }

            return new EmitirNfseResponseDto
            {
                StatusCode = statusCode,
                RawResponseContentType = contentType,
                RawResponseContent = text,
                NfseBase64Gzip = nfseBase64,
                XmlNfse = xmlNfse,
                ChaveAcesso = chaveAcesso,
                Numero = numero,
                CodigoVerificacao = codigoVerificacao,
                UrlNfse = urlNfse
            };
        }

        public CancelarNfseResponseDto ParseCancelarResponse(int statusCode, string contentType, byte[] content)
        {
            var text = TryGetText(content);
            return new CancelarNfseResponseDto
            {
                StatusCode = statusCode,
                ContentType = contentType,
                Content = text
            };
        }

        public DownloadDanfseResponseDto ParseDanfseResponse(int statusCode, string contentType, byte[] content, string chaveAcesso)
        {
            var fileName = $"DANFSe_{SanitizeFile(chaveAcesso)}.pdf";
            return new DownloadDanfseResponseDto
            {
                FileName = fileName,
                ContentType = contentType,
                Content = content
            };
        }

        private static string TryGetText(byte[] bytes)
        {
            if (bytes is null || bytes.Length == 0)
            {
                return string.Empty;
            }

            try
            {
                return Encoding.UTF8.GetString(bytes);
            }
            catch
            {
                return Convert.ToBase64String(bytes);
            }
        }

        private static string? TryInflateFromBase64(string base64)
        {
            try
            {
                var raw = Convert.FromBase64String(base64);
                using var input = new MemoryStream(raw);
                using var gzip = new GZipStream(input, CompressionMode.Decompress);
                using var reader = new StreamReader(gzip, Encoding.UTF8);
                return reader.ReadToEnd();
            }
            catch
            {
                return null;
            }
        }

        private static string? FirstInnerText(XmlDocument document, params string[] xPaths)
        {
            foreach (var path in xPaths)
            {
                var node = document.SelectSingleNode(path);
                if (node is not null && !string.IsNullOrWhiteSpace(node.InnerText))
                {
                    return node.InnerText.Trim();
                }
            }

            return null;
        }

        private static bool IsJson(string contentType) => (contentType ?? string.Empty).Contains("json", StringComparison.OrdinalIgnoreCase);

        private static bool LooksLikeJson(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            var trimmed = text.TrimStart();
            return trimmed.StartsWith("{") || trimmed.StartsWith("[");
        }

        private static bool LooksLikeBase64(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            var trimmed = text.Trim();
            if (trimmed.Length % 4 != 0) return false;
            foreach (var c in trimmed)
            {
                if (!(char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='))
                {
                    return false;
                }
            }
            return true;
        }

        private static string SanitizeFile(string value)
        {
            foreach (var invalid in Path.GetInvalidFileNameChars())
            {
                value = value.Replace(invalid, '_');
            }
            return value;
        }
    }
}
