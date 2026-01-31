using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingList.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddedItemRows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Row",
                table: "Items",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Row",
                table: "Items");
        }
    }
}
