namespace ShoppingList.Server.Models
{
    public class ShopList
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<Item> ListedItems { get; set; } = [];
    }
    
    public class ShopListDTO()
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<Item> ListedItems { get; set; } = [];
    }

    public class ShopListCreateDTO()
    {
        public string Title { get; set; } = string.Empty;
    }
}
