
namespace ShoppingList.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string GoogleId { get; set; } = string.Empty;
        public List<ShopList> ShopLists { get; set; } = [];
    }

    public class UserGetDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<ShopListGetDTO> ShopListsGetDTO { get; set; } = [];
    }

    public class UserCreateDTO
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string GoogleId { get; set; } = string.Empty;
    }
}
