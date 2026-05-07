using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingList.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddedItemPositions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Position",
                table: "Items",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                table: "Items");
        }
    }
}
