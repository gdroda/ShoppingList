using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingList.Server.Models;
using ShoppingList.Server.Services;

namespace ShoppingList.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController: ControllerBase
    {
        private readonly IUserServices _userServices;

        public UserController(IUserServices userServices)
        {
            _userServices = userServices;
        }

        //THIS IS NOT NEEDED CAUSE ITS USED IN AUTHCONTROLLER, WE'RE KEEPING IT JUST IN CASE, delete if not used

        [HttpGet("{name}")]
        public async Task<ActionResult<User>> GetUser(string name)
        {
            var response = await _userServices.GetUser(name);
            if (response != null) return Ok(response);
            else return NotFound();
        }

        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(UserCreateDTO userDTO)
        {
            var response = await _userServices.GetUser(userDTO.Name);
            if (response == null)
            {
                return Ok(await _userServices.CreateUser(userDTO));
            }
            else return BadRequest();
        }
    }
}
