using System;
using System.Security.Cryptography;
using System.Text;
using API_NFSe.Application.Interfaces;

namespace API_NFSe.Tests.Fakes;

public sealed class FakeCryptographyService : ICryptographyService
{
    public string Encrypt(string plainText) => $"enc::{plainText}";

    public string Decrypt(string cipherText)
    {
        return cipherText.StartsWith("enc::", StringComparison.Ordinal)
            ? cipherText.Substring(5)
            : cipherText;
    }

    public string ComputeSha256(string input)
    {
        // Usa SHA256 real para preservar comportamento esperado nos serviços
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
