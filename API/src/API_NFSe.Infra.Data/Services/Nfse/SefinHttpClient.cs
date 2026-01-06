using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace API_NFSe.Infra.Data.Services.Nfse
{
    public sealed class SefinHttpClient : ISefinHttpClient
    {
        private static readonly Uri ProduçãoRestritaBase = new("https://sefin.producaorestrita.nfse.gov.br/SefinNacional/");
        private static readonly Uri ProduçãoBase = new("https://sefin.nfse.gov.br/SefinNacional/");
        private static readonly Uri ProduçãoRestritaAdnBase = new("https://adn.producaorestrita.nfse.gov.br/");
        private static readonly Uri ProduçãoAdnBase = new("https://adn.nfse.gov.br/");

        private readonly IHttpClientFactory _httpClientFactory;

        public SefinHttpClient(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<SefinEmitirResponse> EmitirAsync(string xmlAssinado, int ambiente, X509Certificate2 certificado, CancellationToken cancellationToken)
        {
            var xmlBytes = Encoding.UTF8.GetBytes(xmlAssinado);
            var gzBytes = Gzip(xmlBytes);
            var base64 = Convert.ToBase64String(gzBytes);

            var (httpClient, shouldDispose) = CriarHttpClient(certificado);
            try
            {
                var url = ObterBaseSefin(ambiente, relativo: "nfse");

                using var payload = new StringContent(JsonSerializer.Serialize(new { dpsXmlGZipB64 = base64 }), Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(url, payload, cancellationToken);
                var respBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";

                return new SefinEmitirResponse((int)response.StatusCode, contentType, respBytes);
            }
            finally
            {
                if (shouldDispose)
                {
                    httpClient.Dispose();
                }
            }
        }

        public async Task<SefinCancelarResponse> CancelarAsync(string chaveAcesso, string eventoBase64, int ambiente, X509Certificate2 certificado, CancellationToken cancellationToken)
        {
            var (httpClient, shouldDispose) = CriarHttpClient(certificado);
            try
            {
                var url = ObterBaseSefin(ambiente, relativo: $"nfse/{Uri.EscapeDataString(chaveAcesso)}/eventos");
                using var payload = new StringContent(JsonSerializer.Serialize(new { pedidoRegistroEventoXmlGZipB64 = eventoBase64 }), Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(url, payload, cancellationToken);
                var respBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                return new SefinCancelarResponse((int)response.StatusCode, contentType, respBytes);
            }
            finally
            {
                if (shouldDispose)
                {
                    httpClient.Dispose();
                }
            }
        }

        public async Task<SefinDanfseResponse> DownloadDanfseAsync(string chaveAcesso, int ambiente, X509Certificate2? certificado, CancellationToken cancellationToken)
        {
            var (httpClient, shouldDispose) = CriarHttpClient(certificado);
            try
            {
                var adnUrl = ObterBaseAdn(ambiente, relativo: $"danfse/{Uri.EscapeDataString(chaveAcesso)}");
                var response = await httpClient.GetAsync(adnUrl, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                    var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/pdf";
                    return new SefinDanfseResponse((int)response.StatusCode, contentType, bytes);
                }

                var sefinUrl = ObterBaseSefin(ambiente, relativo: $"danfse/{Uri.EscapeDataString(chaveAcesso)}");
                var response2 = await httpClient.GetAsync(sefinUrl, cancellationToken);
                var respBytes2 = await response2.Content.ReadAsByteArrayAsync(cancellationToken);
                var contentType2 = response2.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
                return new SefinDanfseResponse((int)response2.StatusCode, contentType2, respBytes2);
            }
            finally
            {
                if (shouldDispose)
                {
                    httpClient.Dispose();
                }
            }
        }

        private (HttpClient Client, bool ShouldDispose) CriarHttpClient(X509Certificate2? certificado)
        {
            HttpClient httpClient;
            var shouldDispose = false;

            if (certificado is null)
            {
                httpClient = _httpClientFactory.CreateClient();
            }
            else
            {
                var handler = new HttpClientHandler
                {
                    ClientCertificateOptions = ClientCertificateOption.Manual,
                    SslProtocols = System.Security.Authentication.SslProtocols.Tls12
                };
                handler.ClientCertificates.Add(certificado);
                httpClient = new HttpClient(handler, disposeHandler: true);
                shouldDispose = true;
            }

            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("API_NFSe/1.0");
            httpClient.DefaultRequestVersion = new Version(1, 1);

            return (httpClient, shouldDispose);
        }

        private static Uri ObterBaseSefin(int ambiente, string relativo)
        {
            var baseUri = ambiente == 1 ? ProduçãoBase : ProduçãoRestritaBase;
            return new Uri(baseUri, relativo);
        }

        private static Uri ObterBaseAdn(int ambiente, string relativo)
        {
            var baseUri = ambiente == 1 ? ProduçãoAdnBase : ProduçãoRestritaAdnBase;
            return new Uri(baseUri, relativo);
        }

        private static byte[] Gzip(byte[] payload)
        {
            using var output = new MemoryStream();
            using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true))
            {
                gzip.Write(payload, 0, payload.Length);
            }

            return output.ToArray();
        }
    }

    public readonly record struct SefinEmitirResponse(int StatusCode, string ContentType, byte[] Content);

    public readonly record struct SefinCancelarResponse(int StatusCode, string ContentType, byte[] Content);

    public readonly record struct SefinDanfseResponse(int StatusCode, string ContentType, byte[] Content);
}
