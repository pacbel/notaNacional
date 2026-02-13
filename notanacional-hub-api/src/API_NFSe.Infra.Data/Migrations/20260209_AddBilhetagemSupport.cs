using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API_NFSe.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBilhetagemSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompetenciaSaldo",
                table: "PrestadorConfiguracoes",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreditoMensalPadrao",
                table: "PrestadorConfiguracoes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SaldoNotasDisponiveis",
                table: "PrestadorConfiguracoes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BilhetagemLancamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PrestadorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Quantidade = table.Column<int>(type: "int", nullable: false),
                    SaldoAnterior = table.Column<int>(type: "int", nullable: false),
                    SaldoPosterior = table.Column<int>(type: "int", nullable: false),
                    Observacao = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true, collation: "utf8mb4_general_ci"),
                    UsuarioResponsavelId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilhetagemLancamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilhetagemLancamentos_Prestadores_PrestadorId",
                        column: x => x.PrestadorId,
                        principalTable: "Prestadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_BilhetagemLancamentos_PrestadorId",
                table: "BilhetagemLancamentos",
                column: "PrestadorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BilhetagemLancamentos");

            migrationBuilder.DropColumn(
                name: "CompetenciaSaldo",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "CreditoMensalPadrao",
                table: "PrestadorConfiguracoes");

            migrationBuilder.DropColumn(
                name: "SaldoNotasDisponiveis",
                table: "PrestadorConfiguracoes");
        }
    }
}
