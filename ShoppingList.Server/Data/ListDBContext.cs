using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Data
{
    public class ListDBContext :DbContext, IDataProtectionKeyContext
    {
        public ListDBContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(s => s.ShopLists)
                .WithMany(u => u.Users);


            modelBuilder.Entity<ShopList>()
                .HasMany(s => s.ListedItems)
                .WithOne(u => u.ShopList)
                .HasForeignKey(s => s.ListId);

        }

        public DbSet<Item> Items { get; set; }
        public DbSet<ShopList> ShopLists { get; set; }
        public DbSet<User> Users { get; set; }

        public DbSet<DataProtectionKey> DataProtectionKeys { get; set; } = null!;
    }
}
