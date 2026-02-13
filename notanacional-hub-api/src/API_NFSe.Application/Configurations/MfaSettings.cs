using System;

namespace API_NFSe.Application.Configurations
{
    public class MfaSettings
    {
        public int CodigoExpiracaoMinutos { get; set; } = 10;
        public string AssuntoEmail { get; set; } = "Código de verificação";
        public string TemplatePath { get; set; } = "Templates/MfaCodigoTemplate.html";

        public TimeSpan ObterValidade() => TimeSpan.FromMinutes(CodigoExpiracaoMinutos);
    }
}
