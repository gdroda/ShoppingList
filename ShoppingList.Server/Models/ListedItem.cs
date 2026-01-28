namespace ShoppingList.Server.Models
{
    public class ListedItem
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
        public required int ShopListId { get; set; }
        public required int ItemId { get; set; }
        public required ShopList ShopList { get; set; }
        public required Item Item { get; set; }
        
    }
}
