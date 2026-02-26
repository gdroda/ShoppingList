using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using ShoppingList.Server.Services;
using System.Security.Claims;

namespace ShoppingList.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserServices _userServices;
        public AuthController(IUserServices userServices)
        {
            _userServices = userServices;
        }

        [HttpGet("login")]
        public async Task<IActionResult> GoogleLogin()
        {
            return Challenge(new AuthenticationProperties
            {
                RedirectUri = "/api/auth/callback"
            }, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!result.Succeeded) return Unauthorized();
            return Redirect("https://localhost:64099/");
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetUser()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var name = User.Identity.Name;
                var email = User.FindFirst(c => c.Type == ClaimTypes.Email)?.Value;
                var googleId = User.FindFirst(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var user = await _userServices.GetUser(email);
                if (user != null)
                {
                    return Ok(user);
                }
                else
                {
                    await _userServices.CreateUser(new Models.UserCreateDTO { Name = name, Email = email, GoogleId = googleId });
                }
            }
            return Unauthorized();
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
