using System;

namespace API_NFSe.Application.DTOs.Auth
{
    public class MfaChallengeResponseDto
    {
        public string Email { get; set; } = string.Empty;
        public bool CodigoEnviado { get; set; }
        public DateTime ExpiraEm { get; set; }
        public string Mensagem { get; set; } = string.Empty;
    }
}
