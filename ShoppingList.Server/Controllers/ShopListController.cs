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
        public ShopListController(IShopListService shopListService)
        {
            _shopListService = shopListService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ShopListDTO>> GetShopListId(int id)
        {
            var responce = await _shopListService.GetShopListId(id);
            if (responce != null) return Ok(responce);
            else return NotFound();
        }

        [HttpGet]
        public async Task<ActionResult<List<ShopListDTO>>> GetAllShopList()
        {
            return Ok(await _shopListService.GetAllShopLists());
        }

        [HttpPost]
        public async Task<ActionResult<ShopList>> CreateShopList(ShopListCreateDTO shopListCreateDTO)
        {
            return Ok(await _shopListService.CreateShopList(shopListCreateDTO));
        }
    }
}
