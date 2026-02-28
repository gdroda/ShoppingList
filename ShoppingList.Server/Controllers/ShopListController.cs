using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using ShoppingList.Server.Models;
using ShoppingList.Server.Services;
using System.Security.Claims;
using static Google.Apis.Requests.BatchRequest;

namespace ShoppingList.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShopListController : ControllerBase
    {
        private readonly IShopListService _shopListService;
        private readonly IUserServices _userService;
        public ShopListController(IShopListService shopListService, IUserServices userService)
        {
            _shopListService = shopListService;
            _userService = userService;
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<ShopListGetDTO>> GetShopListId(int id)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _userService.GetUser(email);
                if (user != null)
                {
                    var response = await _shopListService.GetShopListId(id, user.Id);
                    if (response != null) return Ok(response);
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<List<ShopListGetDTO>>> GetAllShopList()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _userService.GetUser(email);
                if (user != null)
                {
                    var response = await _shopListService.GetAllShopLists(user.Id);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ShopList>> CreateShopList([FromBody] ShopListCreateDTO shopListCreateDTO)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _userService.GetUser(email);
                if (user != null)
                {
                    var response = await _shopListService.CreateShopList(shopListCreateDTO, user.Id);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPut("{listId}")]
        public async Task<ActionResult<ShopList>> UpdateShopList([FromBody] ItemCreateDTO[] itemDTO, int listId)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _userService.GetUser(email);
                if (user != null)
                {
                    var response = await _shopListService.UpdateShopList(itemDTO, listId, user.Id);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpDelete("{listId}")]
        public async Task<ActionResult<ShopList>> DeleteList (int listId)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var user = await _userService.GetUser(email);
                if (user != null)
                {
                    var response = await _shopListService.DeleteList(listId, user.Id);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }
    }
}
