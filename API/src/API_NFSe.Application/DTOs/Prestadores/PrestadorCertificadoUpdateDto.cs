namespace API_NFSe.Application.DTOs.Prestadores;

public class PrestadorCertificadoUpdateDto
{
    public string Alias { get; init; } = string.Empty;
    public byte[]? Conteudo { get; init; }
    public string? Senha { get; init; }
}
