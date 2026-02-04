using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IUserServices
    {
        public Task<UserGetDTO> GetUser(string name);
        public Task<User> CreateUser(UserCreateDTO userDTO);
    }

    public class UserServices: IUserServices
    {
        private readonly ListDBContext _dbContext;

        public UserServices(ListDBContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UserGetDTO> GetUser(string name)
        {
            var user = await _dbContext.Users
                .Where(u => u.Name == name)
                .Select(u => new UserGetDTO {
                    Name = u.Name, 
                    ShopListsGetDTO = u.ShopLists.Select(s => new ShopListGetDTO { Title = s.Title, ListedItems = s.ListedItems}).ToList() }).FirstOrDefaultAsync();
            if (user != null)
            {
                return user;
            }
            else return null;
        }

        public async Task<User> CreateUser(UserCreateDTO userDTO)
        {
            var user = new User { Name = userDTO.Name };
            var userCreation = await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();
            return userCreation.Entity;
        }
    }
}
