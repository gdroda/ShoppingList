using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IItemServices
    {
        public Task<List<Item>> GetItems(ShopList list);
        public Task<Item> CreateItem(ItemCreateDTO itemDTO, int listId);
        public Task<string> UpdateItem(Item item, ItemCreateDTO itemDTO);
        public Task<string> DeleteItem(Item item);
    }
    public class ItemServices :IItemServices
    {
        private readonly ListDBContext _dbContext;
        public ItemServices(ListDBContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Item>> GetItems(ShopList list)
        {
            List<Item> listToReturn = [];
            foreach (var item in list.ListedItems)
            {
                listToReturn.Add(item);
            }
            return listToReturn;
        }


        public async Task<Item> CreateItem(ItemCreateDTO itemDTO, int listId)
        {
            var currList = await _dbContext.ShopLists
                .FirstOrDefaultAsync(s => s.Id == listId);

            if (currList != null)
            {
                var newItem = new Item { Name = itemDTO.Name, Price = itemDTO.Price, Quantity = itemDTO.Quantity, IsChecked = itemDTO.IsChecked
                , ShopList = currList, ListId = listId};
                currList.ListedItems.Add(newItem);
                await _dbContext.SaveChangesAsync();

                return newItem;
            }
            else return null!;
        }

        public async Task<string> UpdateItem(Item item, ItemCreateDTO itemDTO)
        {
            var changes = await _dbContext.Items
                .Where(i => i.Id == item.Id)
                .ExecuteUpdateAsync(i => i
                .SetProperty(i => i.Name, itemDTO.Name)
                .SetProperty(i => i.Price, itemDTO.Price)
                .SetProperty(i => i.Quantity, itemDTO.Quantity));

            //var itemToReturn = await _dbContext.Items
            //    .Where(i => i.Id == item.Id)
            //    .FirstOrDefaultAsync();

            if (changes > 0)
            {
                return $"{changes} changes were made";
            }
            else return null!;
        }

        public async Task<string> DeleteItem(Item item)
        {
            _dbContext.Items.Remove(item);
            //await _dbContext.SaveChangesAsync();
            return ($"{item.Name} has been deleted successfully.");
        }
    }
}
