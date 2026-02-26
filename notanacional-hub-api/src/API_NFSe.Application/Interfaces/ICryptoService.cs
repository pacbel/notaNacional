namespace API_NFSe.Application.Interfaces
{
    public interface ICryptoService
    {
        byte[] Encrypt(string text);
        string Decrypt(byte[] bytes);
    }
}
