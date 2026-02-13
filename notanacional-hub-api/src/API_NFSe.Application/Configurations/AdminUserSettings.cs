using API_NFSe.Application.Security;

namespace API_NFSe.Application.Configurations
{
    public class AdminUserSettings
    {
        public string Nome { get; set; } = "Administrador";
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string Role { get; set; } = RoleNames.Administrador;
    }
}
