using Google.Apis.Logging;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IShopListService
    {
        public Task<ShopListGetDTO> GetShopListId(int id, string userEmail);
        public Task<List<ShopListGetDTO>> GetAllShopLists(string userEmail);
        public Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, string userEmail);
        public Task<ShopListGetDTO> UpdateShopList(ItemCreateDTO[] itemDTO, int listId, string userEmail);
        public Task<string> RenameList(int listId, string userEmail, string newName);
        public Task<string> DeleteList(int listId, string userEmail);
        public Task<UserGetDTO> ShareList(int listId, string userEmail, UserEmailOnlyDTO userToShareDTO);
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

        public async Task<ShopListGetDTO> GetShopListId(int id, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var value = await _dbContext.ShopLists
                        .Where(s => s.Id == id)
                        .Where(s => s.Users.Contains(user))
                        .Select(s => new ShopListGetDTO { Id = s.Id, Title = s.Title, ListedItems = s.ListedItems })
                        .FirstOrDefaultAsync();

                    if (value != null)
                    {
                        return value;
                    }
                    else return null!;
                }
                else return null!;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }

        public async Task<List<ShopListGetDTO>> GetAllShopLists(string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var value = await _dbContext.ShopLists
                    //.Where(s => s.UserId == userId)
                    .Where(s => s.Users.Contains(user))
                    .Include(s => s.Users)
                    .Select(s => new ShopListGetDTO { Id = s.Id, Title = s.Title, ListedItems = s.ListedItems })
                    .ToListAsync();
                    return value;
                }
                return null!;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }

        public async Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var newList = new ShopList { Title = shopListCreateDTO.Title};
                    newList.Users.Add(user);
                    await _dbContext.ShopLists.AddAsync(newList);
                    await _dbContext.SaveChangesAsync();
                    return new ShopListGetDTO { Title = newList.Title };
                }
                else return null!;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }

        public async Task<ShopListGetDTO> UpdateShopList(ItemCreateDTO[] itemDTO, int listId, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var currentList = _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
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
                else return null;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }

        public async Task<string> RenameList(int listId, string userEmail, string newName)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var listToRename = _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
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
                else return null;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }
            

        public async Task<string> DeleteList(int listId, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var listToDelete = _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Include(s => s.Users)
                .Where(s => s.Users.Contains(user))
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
                else return null;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }

        }

        public async Task<UserGetDTO> ShareList(int listId, string userEmail, UserEmailOnlyDTO userToShareDTO)
        {
            try
            {
                var currentUser = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (currentUser != null)
                {
                    var listToShare = _dbContext.ShopLists
                                .Where(s => s.Id == listId)
                                .Include(s => s.Users)
                                .Where(s => s.Users.Contains(currentUser))
                                .Include(i => i.ListedItems)
                                .FirstOrDefault();

                    var userToShare = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.Email == userToShareDTO.Email);


                    if (userToShare != null && listToShare != null)
                    {
                        userToShare.ShopLists.Add(listToShare);
                        await _dbContext.SaveChangesAsync();
                        return new UserGetDTO { Email= userToShare.Email, Name = userToShare.Name};
                    }
                    else return null;
                }
                else return null;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
            
        }
    }
}
