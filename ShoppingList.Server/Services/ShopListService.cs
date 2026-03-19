using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IShopListService
    {
        public Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, int userId);
        public Task<ShopListGetDTO> GetShopListId(int id, int userId);
        public Task<List<ShopListGetDTO>> GetAllShopLists(int userId);
        public Task<ShopListGetDTO> UpdateShopList(ItemCreateDTO[] itemDTO, int listId, int userId);
        public Task<string> RenameList(int listId, int userId, string newName);
        public Task<string> DeleteList(int listId, int userId);
        public Task<UserGetDTO> ShareList(int listId, int userId, UserGetDTO userShare);
    }
    public class ShopListService: IShopListService
    {
        private readonly ListDBContext _dbContext;
        private readonly IItemServices _itemServices;
        private readonly IUserServices _userServices;

        public ShopListService(ListDBContext dbContext, IItemServices itemServices, IUserServices userServices)
        {
            _dbContext = dbContext;
            _itemServices = itemServices;
            _userServices = userServices;
        }

        public async Task<ShopListGetDTO> GetShopListId(int id, int userId)
        {
            try
            {
                var value = await _dbContext.ShopLists
                .Where(s => s.Id == id)
                .Where(s => s.UserId == userId)
                .Select(s => new ShopListGetDTO { Id = s.Id, Title = s.Title, ListedItems = s.ListedItems })
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

        public async Task<List<ShopListGetDTO>> GetAllShopLists(int userId)
        {
            var value = await _dbContext.ShopLists
                .Where(s => s.UserId == userId)
                .Select(s => new ShopListGetDTO {Id = s.Id, Title = s.Title, ListedItems = s.ListedItems })
                .ToListAsync();
            return value;
        }

        public async Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, int userId)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                var newList = new ShopList { Title = shopListCreateDTO.Title, UserId = user.Id, User = user };
                var shopListEntity = await _dbContext.ShopLists.AddAsync(newList);
                await _dbContext.SaveChangesAsync();
                return new ShopListGetDTO { Title = newList.Title };
            }
            else return null;
            
        }

        public async Task<ShopListGetDTO> UpdateShopList(ItemCreateDTO[] itemDTO, int listId, int userId)
        {
            var currentList = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Where(s => s.UserId == userId)
                .FirstOrDefault();

            if (currentList != null)
            {
                var itemsToDelete = _dbContext.Items
                    .Where(i => i.ListId == listId)
                    .Include(s => s.ShopList).ToList();

                _dbContext.Items.RemoveRange(itemsToDelete);

                foreach (ItemCreateDTO item in itemDTO)
                {
                    await _itemServices.CreateItem(item, listId);
                }
                await _dbContext.SaveChangesAsync();
                return new ShopListGetDTO { Title = currentList.Title };
            }
            else return null;
        }

        public async Task<string> RenameList(int listId, int userId, string newName)
        {
            var listToRename = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Where(s => s.UserId == userId)
                .Include(i => i.ListedItems)
                .FirstOrDefault();
            
            if (listToRename != null)
            {
                listToRename.Title = newName;
                await _dbContext.SaveChangesAsync();
                return ($"{listToRename} has changed name to {newName}");
            }
            else return null;
        }

        public async Task<string> DeleteList(int listId, int userId)
        {
            var listToDelete = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Where(s => s.UserId == userId)
                .Include(i => i.ListedItems)
                .FirstOrDefault();

            if (listToDelete != null)
            {
                var itemsToDelete = _dbContext.Items
                    .Where(i => i.ListId == listId)
                    .Include(s => s.ShopList).ToList();

                _dbContext.Items.RemoveRange(itemsToDelete);
                _dbContext.ShopLists.Remove(listToDelete);
                await _dbContext.SaveChangesAsync();
                return ($"{listToDelete.Title} has been deleted");
            }
            else return null;
            
        }

        public async Task<UserGetDTO> ShareList(int listId, int userId, UserGetDTO userShare)
        {
            var listToShare = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Where(s => s.UserId == userId)
                .Include(i => i.ListedItems)
                .FirstOrDefault();

            var user = _dbContext.Users
                .Where(u => u.Id == userShare.Id)
                .FirstOrDefault();

            if (user != null && listToShare != null)
            {
                user.ShopLists.Add(listToShare);
                await _dbContext.SaveChangesAsync();
                return userShare;
            }
            else return null;
            
        }
    }
}
