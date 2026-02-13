namespace API_NFSe.Application.Interfaces
{
    public interface ICryptographyService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
        string ComputeSha256(string input);
    }
}
