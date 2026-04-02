using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HideandSeek.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpGet("google-maps-api-key")]
    public IActionResult GetGoogleMapsApiKey()
    {
        var apiKey = _configuration["GoogleMaps:ApiKey"];
        
        if (string.IsNullOrEmpty(apiKey))
        {
            return NotFound(new { error = "Google Maps API key not configured" });
        }

        return Ok(new { apiKey });
    }
}






