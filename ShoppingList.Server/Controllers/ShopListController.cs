using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using ShoppingList.Server.Models;
using ShoppingList.Server.Services;

namespace ShoppingList.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShopListController : ControllerBase
    {
        private readonly IShopListService _shopListService;
        private readonly IItemServices _itemService;
        public ShopListController(IShopListService shopListService, IItemServices itemService)
        {
            _shopListService = shopListService;
            _itemService = itemService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ShopListGetDTO>> GetShopListId(int id)
        {
            var responce = await _shopListService.GetShopListId(id);
            if (responce != null) return Ok(responce);
            else return NotFound();
        }

        [HttpGet]
        public async Task<ActionResult<List<ShopListGetDTO>>> GetAllShopList()
        {
            return Ok(await _shopListService.GetAllShopLists());
        }

        [HttpPost("{name}")]
        public async Task<ActionResult<ShopList>> CreateShopList(ShopListCreateDTO shopListCreateDTO, string name)
        {
            var response = await _shopListService.CreateShopList(shopListCreateDTO, name);
            if (response != null) return Ok(response);
            else return BadRequest();
        }

        [HttpPut("{listId}")]
        public async Task<ActionResult<ShopList>> UpdateShopList(ItemDTO itemDTO, int listId)
        {
            var list = await _shopListService.GetShopListId(listId);
            if (list != null)
            {
                var item = await _itemService.GetItemFromRow(itemDTO, listId);
                if (item != null)
                {
                    var response = await _itemService.UpdateItem(item, itemDTO);
                    if (response != null) return Ok(response);
                }
                else
                {
                    var response = await _itemService.CreateItem(itemDTO, listId);
                    if (response != null) return Ok(response);
                }
                
            }
            return NotFound();
        }
    }
}
