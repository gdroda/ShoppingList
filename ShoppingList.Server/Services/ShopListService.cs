using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IShopListService
    {
        public Task<ShopList> CreateShopList(ShopListCreateDTO shopListCreateDTO);
        public Task<ShopListDTO> GetShopListId(int id);
        public Task<List<ShopListDTO>> GetAllShopLists();
    }
    public class ShopListService: IShopListService
    {
        private readonly ListDBContext _dbContext;

        public ShopListService(ListDBContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ShopListDTO> GetShopListId(int id)
        {
            try
            {
                var value = await _dbContext.ShopLists
                .Where(s => s.Id == id)
                .Select(s => new ShopListDTO { Title = s.Title, ListedItems = s.ListedItems })
                .FirstOrDefaultAsync();
                
                if (value != null)
                {
                    return value;
                }
                else return null!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex}");
                throw;
            }
        }

        public async Task<List<ShopListDTO>> GetAllShopLists()
        {
            var value = await _dbContext.ShopLists
                .Select(s => new ShopListDTO { Title = s.Title, ListedItems = s.ListedItems })
                .ToListAsync();
            return value;
        }

        public async Task<ShopList> CreateShopList(ShopListCreateDTO shopListCreateDTO)
        {
            var newList = new ShopList { Title = shopListCreateDTO.Title, UserId = 0, ListedItems = [] };
            var shopListEntity = await _dbContext.ShopLists.AddAsync(newList);
            await _dbContext.SaveChangesAsync();
            return shopListEntity.Entity;
        }
    }
}
