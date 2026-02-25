// Services/CryptoService.cs
using API_NFSe.Application.Interfaces;
using System.Text;

namespace API_NFSe.Application.Services;

public class CryptoService : ICryptoService
{
    private const string Chave = "seguranca";

    static CryptoService()
    {
        // Necessário no .NET Core/5+ para encodings como Windows-1252
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
    }

    public byte[] Encrypt(string text)
    {
        var encoding = Encoding.GetEncoding(1252);
        var chaveBytes = encoding.GetBytes(Chave);
        var textBytes = encoding.GetBytes(text);
        var result = new byte[textBytes.Length];

        int indChave = 0;
        for (int i = 0; i < textBytes.Length; i++)
        {
            result[i] = (byte)(textBytes[i] + chaveBytes[indChave]);
            indChave = (indChave + 1) % chaveBytes.Length;
        }

        return result.ToArray();
    }

    public string Decrypt(byte[] bytes)
    {
        var encoding = Encoding.GetEncoding(1252);
        var chaveBytes = encoding.GetBytes(Chave);
        var result = new byte[bytes.Length];

        int indChave = 0;
        for (int i = 0; i < bytes.Length; i++)
        {
            result[i] = (byte)(bytes[i] - chaveBytes[indChave]);
            indChave = (indChave + 1) % chaveBytes.Length;
        }

        return encoding.GetString(result);
    }
}