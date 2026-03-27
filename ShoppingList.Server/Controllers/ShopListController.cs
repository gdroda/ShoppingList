using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingList.Server.Hubs;
using ShoppingList.Server.Models;
using ShoppingList.Server.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace ShoppingList.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShopListController : ControllerBase
    {
        private readonly IShopListService _shopListService;
        private readonly IHubContext<NotificationHubService, INotificationHubService> _hubContext;
        public ShopListController(IShopListService shopListService, IHubContext<NotificationHubService, INotificationHubService> notificationHubService)
        {
            _shopListService = shopListService;
            _hubContext = notificationHubService;
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<ShopListGetDTO>> GetShopListId(int id)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                if (email != null)
                {
                    var response = await _shopListService.GetShopListId(id, email);
                    if (response != null) return Ok(response);
                    else return BadRequest();
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
                if (email != null)
                {
                    var response = await _shopListService.GetAllShopLists(email);
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
                if (email != null)
                {
                    var response = await _shopListService.CreateShopList(shopListCreateDTO, email);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPut("rename/{listId}")]
        public async Task<ActionResult<ShopList>> RenameShopList(int listId, [FromBody] ShopListCreateDTO titleOnly)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                if (email != null)
                {
                    var response = await _shopListService.RenameList(listId, email, titleOnly.Title);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPut("share/{listId}")]
        public async Task<ActionResult<UserGetDTO>> ShareShopList(int listId, [FromBody] UserEmailOnlyDTO emailOnly)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                if (email != null)
                {
                    var response = await _shopListService.ShareList(listId, email, emailOnly);
                    if (response != null)
                    {
                        return Ok(response);
                    }
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
                if (email != null)
                {
                    var response = await _shopListService.UpdateShopList(itemDTO, listId, email);
                    if (response != null)
                    {
                        await _hubContext.Clients.Group($"list_{listId}").NewNotification(email, listId);
                        return Ok(response);
                    }
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
                if (email != null)
                {
                    var response = await _shopListService.DeleteList(listId, email);
                    if (response != null) return Ok(response);
                    else return BadRequest();
                }
                else return NotFound();
            }
            return Unauthorized();
        }
    }
}
