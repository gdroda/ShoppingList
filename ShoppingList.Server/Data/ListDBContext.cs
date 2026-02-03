using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Data
{
    public class ListDBContext :DbContext
    {
        public ListDBContext(DbContextOptions options) : base(options)
        {

        }

        public DbSet<Item> Items { get; set; }
        public DbSet<ShopList> ShopLists { get; set; }
        public DbSet<User> Users { get; set; }
    }
}
