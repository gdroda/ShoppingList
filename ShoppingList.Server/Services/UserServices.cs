using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IUserServices
    {
        public Task<User> GetUser(string name);
        public Task<User> CreateUser(UserDTO userDTO);
    }

    public class UserServices: IUserServices
    {
        private readonly ListDBContext _dbContext;

        public UserServices(ListDBContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<User> GetUser(string name)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Name == name);
            if (user != null)
            {
                return user;
            }
            else return null;
        }

        public async Task<User> CreateUser(UserDTO userDTO)
        {
            var user = new User { Name = userDTO.Name };
            var userCreation = await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();
            return userCreation.Entity;
        }
    }
}
