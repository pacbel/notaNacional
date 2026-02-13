using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API_NFSe.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UsuarioId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UsuarioNome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Metodo = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_general_ci"),
                    Rota = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false, collation: "utf8mb4_general_ci"),
                    Acao = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: false, collation: "utf8mb4_general_ci"),
                    StatusCode = table.Column<int>(type: "int", nullable: false),
                    Ip = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false, collation: "utf8mb4_general_ci"),
                    Payload = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci"),
                    DataHora = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "Prestadores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Cnpj = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false, collation: "utf8mb4_general_ci"),
                    RazaoSocial = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    NomeFantasia = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    InscricaoMunicipal = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci"),
                    InscricaoEstadual = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci"),
                    Cnae = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true, collation: "utf8mb4_general_ci"),
                    TipoEmissao = table.Column<int>(type: "int", nullable: false),
                    CodigoMunicipioIbge = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, collation: "utf8mb4_general_ci"),
                    OptanteSimplesNacional = table.Column<int>(type: "int", nullable: false),
                    RegimeEspecialTributario = table.Column<int>(type: "int", nullable: false),
                    Telefone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci"),
                    Email = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: true, collation: "utf8mb4_general_ci"),
                    Website = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_general_ci"),
                    Endereco_Logradouro = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Endereco_Numero = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_general_ci"),
                    Endereco_Complemento = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci"),
                    Endereco_Bairro = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false, collation: "utf8mb4_general_ci"),
                    Endereco_CodigoMunicipioIbge = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, collation: "utf8mb4_general_ci"),
                    Endereco_Uf = table.Column<string>(type: "varchar(2)", maxLength: 2, nullable: true, collation: "utf8mb4_general_ci"),
                    Endereco_Cep = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true, collation: "utf8mb4_general_ci"),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    AtualizadoPorUsuarioId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prestadores", x => x.Id);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "PrestadorCertificados",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Alias = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci"),
                    TipoArmazenamento = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    DadosCertificado = table.Column<string>(type: "varchar(260)", maxLength: 260, nullable: false, collation: "utf8mb4_general_ci"),
                    HashConteudo = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false, collation: "utf8mb4_general_ci"),
                    TamanhoBytes = table.Column<long>(type: "bigint", nullable: false),
                    SenhaProtegida = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true, collation: "utf8mb4_general_ci"),
                    DataValidade = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AtualizadoPorUsuarioId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Thumbprint = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false, collation: "utf8mb4_general_ci"),
                    CommonName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Subject = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false, collation: "utf8mb4_general_ci"),
                    Issuer = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false, collation: "utf8mb4_general_ci"),
                    Cnpj = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false, collation: "utf8mb4_general_ci"),
                    NotBefore = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NotAfter = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataEnvio = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrestadorCertificados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrestadorCertificados_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "PrestadorConfiguracoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Ambiente = table.Column<int>(type: "int", nullable: false),
                    VersaoAplicacao = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    SeriePadrao = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: false, collation: "utf8mb4_general_ci"),
                    NumeroAtual = table.Column<long>(type: "bigint", nullable: false),
                    UrlEnvio = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci"),
                    UrlConsulta = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci"),
                    EnviaEmailAutomatico = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AtualizadoPorUsuarioId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    SmtpHost = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci"),
                    SmtpPort = table.Column<int>(type: "int", nullable: true),
                    SmtpSecure = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SmtpUser = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_general_ci"),
                    SmtpPasswordEncrypted = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true, collation: "utf8mb4_general_ci"),
                    SmtpFrom = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_general_ci"),
                    SmtpFromName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_general_ci"),
                    SmtpResetPasswordUrl = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci"),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrestadorConfiguracoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrestadorConfiguracoes_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "RobotClients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    ClientId = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false, collation: "utf8mb4_general_ci"),
                    SecretHash = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci"),
                    Scopes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci"),
                    Role = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RobotClients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RobotClients_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    NomeEncrypted = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false, collation: "utf8mb4_general_ci"),
                    EmailEncrypted = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false, collation: "utf8mb4_general_ci"),
                    EmailHash = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false, collation: "utf8mb4_general_ci"),
                    SenhaHash = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: false, collation: "utf8mb4_general_ci"),
                    Role = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    ResetToken = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci"),
                    ResetTokenExpiraEm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    RefreshToken = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci"),
                    RefreshTokenExpiraEm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MfaCodeHash = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci"),
                    MfaCodeExpiraEm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "Dps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UsuarioId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Versao = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: false, collation: "utf8mb4_general_ci"),
                    Identificador = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false, collation: "utf8mb4_general_ci"),
                    Ambiente = table.Column<int>(type: "int", nullable: false),
                    DataHoraEmissao = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    VersaoAplicacao = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    Serie = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: false, collation: "utf8mb4_general_ci"),
                    NumeroDps = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci"),
                    DataCompetencia = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TipoEmissao = table.Column<int>(type: "int", nullable: false),
                    CodigoLocalEmissao = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, collation: "utf8mb4_general_ci"),
                    RegimeTributario_OptanteSimplesNacional = table.Column<int>(type: "int", nullable: false),
                    RegimeTributario_RegimeEspecial = table.Column<int>(type: "int", nullable: false),
                    Tomador_TipoDocumento = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Documento = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Email = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: true, collation: "utf8mb4_general_ci"),
                    Tomador_Telefone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Logradouro = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Numero = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Complemento = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Bairro = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_CodigoMunicipioIbge = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Uf = table.Column<string>(type: "varchar(2)", maxLength: 2, nullable: true, collation: "utf8mb4_general_ci"),
                    Tomador_Endereco_Cep = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true, collation: "utf8mb4_general_ci"),
                    Servico_CodigoLocalPrestacao = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, collation: "utf8mb4_general_ci"),
                    Servico_CodigoTributacaoNacional = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_general_ci"),
                    Servico_CodigoTributacaoMunicipal = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_general_ci"),
                    Servico_DescricaoServico = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_general_ci"),
                    Servico_InformacoesComplementares = table.Column<string>(type: "varchar(1024)", maxLength: 1024, nullable: true, collation: "utf8mb4_general_ci"),
                    Valores_ValorServico = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Valores_Tributos_IssRetido = table.Column<int>(type: "int", nullable: false),
                    Valores_Tributos_TipoRetencaoIss = table.Column<int>(type: "int", nullable: false),
                    Valores_Tributos_Totais_Federal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Valores_Tributos_Totais_Estadual = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Valores_Tributos_Totais_Municipal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    XmlAssinado = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_general_ci"),
                    JsonEntrada = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_general_ci"),
                    DigestValue = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci"),
                    Protocolo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci"),
                    MensagemErro = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_general_ci"),
                    DataEnvio = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: true),
                    DataRetorno = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Dps_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Dps_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Dps_PrestadorId_Identificador",
                table: "Dps",
                columns: new[] { "PrestadorId", "Identificador" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dps_UsuarioId",
                table: "Dps",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_PrestadorCertificados_Alias",
                table: "PrestadorCertificados",
                column: "Alias");

            migrationBuilder.CreateIndex(
                name: "IX_PrestadorCertificados_DadosCertificado",
                table: "PrestadorCertificados",
                column: "DadosCertificado",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrestadorCertificados_PrestadorId_Cnpj_Thumbprint",
                table: "PrestadorCertificados",
                columns: new[] { "PrestadorId", "Cnpj", "Thumbprint" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrestadorCertificados_Thumbprint",
                table: "PrestadorCertificados",
                column: "Thumbprint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrestadorConfiguracoes_PrestadorId",
                table: "PrestadorConfiguracoes",
                column: "PrestadorId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Prestadores_Cnpj",
                table: "Prestadores",
                column: "Cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RobotClients_ClientId",
                table: "RobotClients",
                column: "ClientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RobotClients_PrestadorId",
                table: "RobotClients",
                column: "PrestadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_EmailHash",
                table: "Usuarios",
                column: "EmailHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_PrestadorId",
                table: "Usuarios",
                column: "PrestadorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Dps");

            migrationBuilder.DropTable(
                name: "PrestadorCertificados");

            migrationBuilder.DropTable(
                name: "PrestadorConfiguracoes");

            migrationBuilder.DropTable(
                name: "RobotClients");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Prestadores");
        }
    }
}
