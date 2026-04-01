using Microsoft.Extensions.Logging;
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
        private readonly ILogger<ShopListService> _logger;

        public ShopListService(ListDBContext dbContext, IItemServices itemServices
            , IUserServices userServices
            , ILogger<ShopListService> logger)
        {
            _dbContext = dbContext;
            _itemServices = itemServices;
            _logger = logger;
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
                    else
                    {
                        _logger.LogWarning("List was not found with id: {Id}, user: {Email}", id, userEmail);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User was not found when getting list by id: {Id}, user: {Email}", id, userEmail);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error retrieving list by id: {Id}, user: {Email}", id, userEmail);
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
                    .Where(s => s.Users.Contains(user))
                    .Include(s => s.Users)
                    .Select(s => new ShopListGetDTO { Id = s.Id, Title = s.Title, ListedItems = s.ListedItems })
                    .ToListAsync();
                    return value;
                }
                else
                {
                    _logger.LogWarning("User was not found when getting all lists of user: {Email}", userEmail);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error retrieving all lists of user: {Email}", userEmail);
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
                else
                {
                    _logger.LogWarning("User was not found when creating a list for user: {Email}", userEmail);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error creating a shoplist. User: {Email}, shoplist: {ShoplistDTO}", userEmail, shopListCreateDTO);
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
                    else
                    {
                        _logger.LogWarning("List not found when updating list. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when updating list. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when updating a list. User: {Email}, List Id: {ListId}, Items: {ItemDTO}", userEmail, listId, itemDTO);
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
                        return ($"{listToRename.Title} has changed name to {newName}");
                    }
                    else
                    {
                        _logger.LogWarning("List not found when renaming list. User: {Email}, Id: {ListId}, New Name: {NewName}", userEmail, listId, newName);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when renaming list. User: {Email}, Id: {ListId}, New Name: {NewName}", userEmail, listId, newName);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when renaming a list. User: {Email}, List Id: {ListId}, New Name: {NewName}", userEmail, listId, newName);
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
                    else
                    {
                        _logger.LogWarning("List not found when deleting said list. User: {Email}, Id: {ListId}", userEmail, listId);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when deleting list. User: {Email}, Id: {ListId}", userEmail, listId);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when deleting a list. User: {Email}, List Id: {ListId}", userEmail, listId);
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
                        return new UserGetDTO { Email = userToShare.Email, Name = userToShare.Name };
                    }
                    else
                    {
                        _logger.LogWarning("List not found when sharing said list. User: {Email}, Share User: {UserToShare}, Id: {ListId}", userEmail, userToShareDTO, listId);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when sharing a list. User: {Email}, Share User: {UserToShare}, Id: {ListId}", userEmail, userToShareDTO, listId);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when sharing a list. User: {Email}, Share User: {UserToShare}, List Id: {ListId}", userEmail, userToShareDTO,listId);
                throw;
            }
            
        }
    }
}
