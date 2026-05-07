namespace ShoppingList.Server.Models
{
    public class Item
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public bool IsChecked { get; set; }
        public double Position { get; set; }
        public int ListId { get; set; }
        public required ShopList ShopList { get; set; }
    }

    public class ItemCreateDTO()
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public bool IsChecked { get; set; }
        public double Position { get; set; }
    }

    public class ItemGetDTO()
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public bool IsChecked { get; set; }
        public double Position { get; set; }
    }
    
    public class ItemPatchDTO(): ItemCreateDTO
    { 
        public int Id { get; set; }
    }
}
