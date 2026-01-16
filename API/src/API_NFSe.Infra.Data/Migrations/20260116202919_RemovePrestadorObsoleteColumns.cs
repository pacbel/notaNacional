using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API_NFSe.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemovePrestadorObsoleteColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cnae",
                table: "Prestadores");

            migrationBuilder.DropColumn(
                name: "CodigoMunicipioIbge",
                table: "Prestadores");

            migrationBuilder.DropColumn(
                name: "OptanteSimplesNacional",
                table: "Prestadores");

            migrationBuilder.DropColumn(
                name: "RegimeEspecialTributario",
                table: "Prestadores");

            migrationBuilder.DropColumn(
                name: "TipoEmissao",
                table: "Prestadores");

            migrationBuilder.DropColumn(
                name: "Ambiente",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "NumeroAtual",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "SeriePadrao",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "UrlConsulta",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "UrlEnvio",
                table: "PrestadorConfiguracoes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cnae",
                table: "Prestadores",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true,
                collation: "utf8mb4_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "CodigoMunicipioIbge",
                table: "Prestadores",
                type: "varchar(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "",
                collation: "utf8mb4_general_ci");

            migrationBuilder.AddColumn<int>(
                name: "OptanteSimplesNacional",
                table: "Prestadores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RegimeEspecialTributario",
                table: "Prestadores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TipoEmissao",
                table: "Prestadores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Ambiente",
                table: "PrestadorConfiguracoes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "NumeroAtual",
                table: "PrestadorConfiguracoes",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "SeriePadrao",
                table: "PrestadorConfiguracoes",
                type: "varchar(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "",
                collation: "utf8mb4_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "UrlConsulta",
                table: "PrestadorConfiguracoes",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true,
                collation: "utf8mb4_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "UrlEnvio",
                table: "PrestadorConfiguracoes",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true,
                collation: "utf8mb4_general_ci");
        }
    }
}
