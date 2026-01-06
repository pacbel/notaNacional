using System;

namespace API_NFSe.Application.DTOs.Prestadores;

public class PrestadorCertificadoUploadDto
{
    public string Alias { get; init; } = string.Empty;
    public byte[] Conteudo { get; init; } = Array.Empty<byte>();
    public string? Senha { get; init; }
}
