using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Data
{
    public class ListDBContext :DbContext
    {
        public ListDBContext(DbContextOptions options) : base(options)
        {

        }

        /*
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ListedItem>()
                .HasOne(li => li.ShopList)
                .WithMany(l => l.ListedItems)
                .HasForeignKey(li => li.ShopListId);

            modelBuilder.Entity<ListedItem>()
                .HasOne(li => li.Item)
                .WithMany()
                .HasForeignKey(li => li.ItemId);
        }*/

        public DbSet<Item> Items { get; set; }
        public DbSet<ShopList> ShopLists { get; set; }
        //public DbSet<ListedItem> ListedItems { get; set; }
    }
}
