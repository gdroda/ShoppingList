using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IShopListService
    {
        public Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, string userName);
        public Task<ShopListGetDTO> GetShopListId(int id);
        public Task<List<ShopListGetDTO>> GetAllShopLists();
        public Task<ShopListGetDTO> UpdateShopList(ItemDTO itemDTO, int listId);
    }
    public class ShopListService: IShopListService
    {
        private readonly ListDBContext _dbContext;
        private readonly IUserServices _userServices;

        public ShopListService(ListDBContext dbContext, IUserServices userServices)
        {
            _dbContext = dbContext;
            _userServices = userServices;
        }

        public async Task<ShopListGetDTO> GetShopListId(int id)
        {
            try
            {
                var value = await _dbContext.ShopLists
                .Where(s => s.Id == id)
                .Select(s => new ShopListGetDTO {Title = s.Title, ListedItems = s.ListedItems })
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

        public async Task<List<ShopListGetDTO>> GetAllShopLists()
        {
            var value = await _dbContext.ShopLists
                .Select(s => new ShopListGetDTO { Title = s.Title, ListedItems = s.ListedItems })
                .ToListAsync();
            return value;
        }

        public async Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, string userName)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Name == userName);
            if (user != null)
            {
                var newList = new ShopList { Title = shopListCreateDTO.Title, UserId = user.Id, User = user };
                var shopListEntity = await _dbContext.ShopLists.AddAsync(newList);
                await _dbContext.SaveChangesAsync();
                return new ShopListGetDTO { Title = newList.Title };
            }
            else return null;
            
        }

        public async Task<ShopListGetDTO> UpdateShopList(ItemDTO itemDTO, int listId)
        {
            /*
            List<ListedItem> tempItemList = new();
            var currentList = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Select(s => new ShopListDTO { Id = s.Id, Title = s.Title, ListedItems = s.ListedItems }).FirstOrDefault();
            if (currentList != null) 
            {
                tempItemList = new List<Item>(currentList.ListedItems);
            }
            else return null;

            tempItemList.Add(item);

            */
            throw new NotImplementedException();

        }
    }
}
