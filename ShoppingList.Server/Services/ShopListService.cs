using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using System.Collections.Immutable;

namespace ShoppingList.Server.Services
{
    public interface IShopListService
    {
        public Task<ShopListGetDTO> GetShopListId(int id, string userEmail);
        public Task<List<ShopListGetDTO>> GetAllShopLists(string userEmail);
        public Task<ShopListGetDTO> CreateShopList(ShopListCreateDTO shopListCreateDTO, string userEmail);
        public Task<ShopListGetDTO> UpdateShopList(ItemCreateDTO[] itemDTO, int listId, string userEmail); //to be removed
        public Task<ShopListGetDTO>  UpdateShopListAddItem(ItemPatchDTO itemDTO, int listId, string userEmail);
        public Task<ShopListGetDTO>  UpdateShopListRemoveItem(int listId, int itemId, string userEmail);
        public Task<ShopListGetDTO> UpdateShopListItemById(ItemPatchDTO itemDTO, int listId, string userEmail);
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
                        .Select(s => new ShopListGetDTO { Id = s.Id, Title = s.Title, 
                            ListedItems = s.ListedItems.Select(i => new ItemGetDTO
                            {
                                Id = i.Id, Name = i.Name, Quantity = i.Quantity, Price = i.Price, IsChecked = i.IsChecked
                            }).ToList() ?? new List<ItemGetDTO>()
                        })
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
                    .Select(s => new ShopListGetDTO
                    {
                        Id = s.Id,
                        Title = s.Title,
                        ListedItems = s.ListedItems.Select(i => new ItemGetDTO
                        {
                            Id = i.Id,
                            Name = i.Name,
                            Quantity = i.Quantity,
                            Price = i.Price,
                            IsChecked = i.IsChecked
                        }).ToList() ?? new List<ItemGetDTO>()
                    })
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
                    var userLists = await _dbContext.ShopLists
                        .Include(u => u.Users)
                        .Where(s => s.Users.Contains(user))
                        .ToListAsync();

                    if (userLists.Count < 20) //Add UI indication for this
                    {
                        var newList = new ShopList { Title = shopListCreateDTO.Title };
                        newList.Users.Add(user);
                        await _dbContext.ShopLists.AddAsync(newList);
                        await _dbContext.SaveChangesAsync();
                        return new ShopListGetDTO { Title = newList.Title };
                    }
                    else
                    {
                        _logger.LogWarning("List cap reached for user: {Email}", userEmail);
                        return null!;
                    }
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
                if (itemDTO.Length > 100)
                {
                    _logger.LogWarning("Item cap of 100 reached. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                    return null!;
                }
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var currentList = await _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
                        .FirstOrDefaultAsync();

                    if (currentList != null)
                    {
                        
                        await _dbContext.SaveChangesAsync();
                        return new ShopListGetDTO { Title = currentList.Title, 
                            ListedItems = currentList.ListedItems.Select(i => new ItemGetDTO
                            {
                                Id = i.Id,
                                Name = i.Name,
                                Quantity = i.Quantity,
                                Price = i.Price,
                                IsChecked = i.IsChecked
                            }).ToList() ?? new List<ItemGetDTO>(),
                            Id = currentList.Id };

                        /*
                        var itemsToDelete = _dbContext.Items
                            .Where(i => i.ListId == listId)
                            .Include(s => s.ShopList).ToList();

                        _dbContext.Items.RemoveRange(itemsToDelete);

                        foreach (ItemCreateDTO item in itemDTO)
                        {
                            await _itemServices.CreateItem(item, listId);
                        }
                        await _dbContext.SaveChangesAsync();
                        return new ShopListGetDTO { Title = currentList.Title };*/
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

        public async Task<ShopListGetDTO> UpdateShopListAddItem(ItemPatchDTO itemDTO, int listId, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var currentList = await _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
                        .FirstOrDefaultAsync();

                    if (currentList != null)
                    {
                        if (currentList.ListedItems.Count > 100)
                        {
                            _logger.LogWarning("Item cap of 100 reached. User: {Email}, Id: {ListId}, Items: {ItemDTO}", userEmail, listId, itemDTO);
                            return null!;
                        }

                        bool exists = await _dbContext.Items
                            .Where(i => i.Id == itemDTO.Id)
                            .Include(i => i.ShopList)
                            .AnyAsync();

                        if (!exists)
                        {
                            await _itemServices.CreateItem(new ItemCreateDTO { Name = itemDTO.Name, IsChecked = itemDTO.IsChecked, Price = itemDTO.Price, Quantity = itemDTO.Quantity }, listId);
                            await _dbContext.SaveChangesAsync();
                            return new ShopListGetDTO { Title = currentList.Title, ListedItems = currentList.ListedItems.Select(i => new ItemGetDTO
                            {
                                Id = i.Id,
                                Name = i.Name,
                                Quantity = i.Quantity,
                                Price = i.Price,
                                IsChecked = i.IsChecked
                            }).ToList() ?? new List<ItemGetDTO>(), Id = currentList.Id };
                        }
                        else
                        {
                            _logger.LogWarning("Item already exists when adding item to list. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                            return null!;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("List not found when adding item to list. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when adding item to list. User: {Email}, Id: {ListId}, Items: {ItemsDTO}", userEmail, listId, itemDTO);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when adding item to list. User: {Email}, List Id: {ListId}, Items: {ItemDTO}", userEmail, listId, itemDTO);
                throw;
            }
        }

        public async Task<ShopListGetDTO> UpdateShopListRemoveItem(int listId, int itemId, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var currentList = await _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
                        .FirstOrDefaultAsync();

                    if (currentList != null)
                    {
                        var item = await _dbContext.Items
                            .Where(i => i.Id == itemId)
                            .Include(i => i.ShopList)
                            .FirstAsync();
                        if (item != null)
                        {
                            _dbContext.Items.Remove(item);
                            await _dbContext.SaveChangesAsync();
                            return new ShopListGetDTO { Title = currentList.Title, ListedItems = currentList.ListedItems.Select(i => new ItemGetDTO
                            {
                                Id = i.Id,
                                Name = i.Name,
                                Quantity = i.Quantity,
                                Price = i.Price,
                                IsChecked = i.IsChecked
                            }).ToList() ?? new List<ItemGetDTO>(), Id = currentList.Id };
                        }
                        else
                        {
                            _logger.LogWarning("Item not found when removing item from list. User: {Email}, Id: {ListId}, ItemId: {itemId}", userEmail, listId, itemId);
                            return null!;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("List not found when removing item from list. User: {Email}, Id: {ListId}, ItemId: {itemId}", userEmail, listId, itemId);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when removing item from list. User: {Email}, Id: {ListId}, ItemId: {itemId}", userEmail, listId, itemId);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when removing item from list. User: {Email}, List Id: {ListId}, ItemId: {itemId}", userEmail, listId, itemId);
                throw;
            }
        }

        public async Task<ShopListGetDTO> UpdateShopListItemById(ItemPatchDTO itemDTO, int listId, string userEmail)
        {
            try
            {
                var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (user != null)
                {
                    var currentList = await _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
                        .FirstOrDefaultAsync();

                    if (currentList != null)
                    {
                        var itemToChange = await _dbContext.Items
                        .Where(i => i.Id == itemDTO.Id)
                        .Include(i => i.ShopList)
                        .Where(i => i.ShopList.Id == currentList.Id)
                        .FirstOrDefaultAsync();

                        if (itemToChange != null)
                        {
                            itemToChange.Name = itemDTO.Name;
                            itemToChange.Price = itemDTO.Price;
                            itemToChange.Quantity = itemDTO.Quantity;
                            itemToChange.IsChecked = itemDTO.IsChecked;

                            await _dbContext.SaveChangesAsync();
                            return new ShopListGetDTO { Id = currentList.Id, Title = currentList.Title, ListedItems = currentList.ListedItems.Select(i => new ItemGetDTO
                            {
                                Id = i.Id,
                                Name = i.Name,
                                Quantity = i.Quantity,
                                Price = i.Price,
                                IsChecked = i.IsChecked
                            }).ToList() ?? new List<ItemGetDTO>()
                            };
                        }
                        else
                        {
                            _logger.LogWarning("Item not found when updating a list item by id. User: {Email}, Id: {ListId}, Item: {ItemDTO}", userEmail, listId, itemDTO);
                            return null!;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("List not found when updating a list item by id. User: {Email}, Id: {ListId}, Item: {ItemDTO}", userEmail, listId, itemDTO);
                        return null!;
                    }
                }
                else
                {
                    _logger.LogWarning("User not found when updating a list item by id. User: {Email}, Id: {ListId}, Item: {ItemDTO}", userEmail, listId, itemDTO);
                    return null!;
                }
            }
            catch (Exception err)
            {
                _logger.LogError(err, "Error when updating a list item by id. User: {Email}, List Id: {ListId}, Item: {itemDTO}", userEmail, listId, itemDTO);
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
                    var listToRename = await _dbContext.ShopLists
                        .Where(s => s.Id == listId)
                        .Include(s => s.Users)
                        .Where(s => s.Users.Contains(user))
                        .Include(i => i.ListedItems)
                        .FirstOrDefaultAsync();

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
                    var listToDelete = await _dbContext.ShopLists
                .Where(s => s.Id == listId)
                .Include(s => s.Users)
                .Where(s => s.Users.Contains(user))
                .Include(i => i.ListedItems)
                .FirstOrDefaultAsync();

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
                    var listToShare =  await _dbContext.ShopLists
                                .Where(s => s.Id == listId)
                                .Include(s => s.Users)
                                .Where(s => s.Users.Contains(currentUser))
                                .Include(i => i.ListedItems)
                                .FirstOrDefaultAsync();

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
