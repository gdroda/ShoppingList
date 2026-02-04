using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Models;
using System.Reflection.Metadata;

namespace ShoppingList.Server.Data
{
    public class ListDBContext :DbContext
    {
        public ListDBContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(s => s.ShopLists)
                .WithOne(u => u.User)
                .HasForeignKey(s => s.UserId);
                
        }

        public DbSet<Item> Items { get; set; }
        public DbSet<ShopList> ShopLists { get; set; }
        public DbSet<User> Users { get; set; }
    }
}
