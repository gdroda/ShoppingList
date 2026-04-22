using Microsoft.EntityFrameworkCore;
using ShoppingList.Server.Data;
using ShoppingList.Server.Models;

namespace ShoppingList.Server.Services
{
    public interface IUserServices
    {
        public Task<UserGetDTO> GetUser(string email);
        public Task<User> CreateUser(UserCreateDTO userDTO);
    }

    public class UserServices: IUserServices
    {
        private readonly ListDBContext _dbContext;

        public UserServices(ListDBContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UserGetDTO> GetUser(string email)
        {
            try
            {
                var user = await _dbContext.Users
                .Where(u => u.Email == email)
                .Select(u => new UserGetDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    AllLists = u.ShopLists.Select(s => new ShopListGetDTO {Id = s.Id, Title = s.Title, ListedItems = s.ListedItems }).ToList()
                }).FirstOrDefaultAsync();
                if (user != null)
                {
                    return user;
                }
                else return null;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }

        public async Task<User> CreateUser(UserCreateDTO userDTO)
        {
            try
            {
                var user = new User { Name = userDTO.Name, Email = userDTO.Email, GoogleId = userDTO.GoogleId };
                var userCreation = await _dbContext.Users.AddAsync(user);
                await _dbContext.SaveChangesAsync();
                return userCreation.Entity;
            }
            catch (Exception err)
            {
                Console.WriteLine($"Error: {err.Message}");
                throw;
            }
        }
    }
}
