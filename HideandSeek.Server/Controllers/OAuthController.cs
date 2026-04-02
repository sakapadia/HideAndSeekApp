using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace HideandSeek.Server.Controllers;

/// <summary>
/// API controller for OAuth authentication with Google, Facebook, and Microsoft.
/// Provides endpoints for OAuth flow initiation and callback handling.
/// 
/// Base Route: /api/auth
/// </summary>
[ApiController]
[Route("api/auth")]
public class OAuthController : ControllerBase
{
    private readonly IOAuthService _oauthService;
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;
    private readonly ITokenEncryptionService _tokenEncryption;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OAuthController> _logger;

    public OAuthController(
        IOAuthService oauthService,
        IUserService userService,
        IJwtService jwtService,
        ITokenEncryptionService tokenEncryption,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<OAuthController> logger)
    {
        _oauthService = oauthService;
        _userService = userService;
        _jwtService = jwtService;
        _tokenEncryption = tokenEncryption;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/auth/google
    /// 
    /// Initiates Google OAuth flow by redirecting to Google's authorization URL.
    /// </summary>
    [HttpGet("google")]
    public IActionResult GoogleAuth()
    {
        try
        {
            var authUrl = _oauthService.GetGoogleAuthUrl();
            return Redirect(authUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Google OAuth");
            return BadRequest("OAuth configuration error");
        }
    }

    /// <summary>
    /// GET /api/auth/facebook
    /// 
    /// Initiates Facebook OAuth flow by redirecting to Facebook's authorization URL.
    /// </summary>
    [HttpGet("facebook")]
    public IActionResult FacebookAuth()
    {
        try
        {
            var authUrl = _oauthService.GetFacebookAuthUrl();
            return Redirect(authUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Facebook OAuth");
            return BadRequest("OAuth configuration error");
        }
    }

    /// <summary>
    /// GET /api/auth/microsoft
    /// 
    /// Initiates Microsoft OAuth flow by redirecting to Microsoft's authorization URL.
    /// </summary>
    [HttpGet("microsoft")]
    public IActionResult MicrosoftAuth()
    {
        try
        {
            var authUrl = _oauthService.GetMicrosoftAuthUrl();
            return Redirect(authUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Microsoft OAuth");
            return BadRequest("OAuth configuration error");
        }
    }

    /// <summary>
    /// GET /api/auth/google/callback
    /// 
    /// Handles Google OAuth callback and creates/updates user account.
    /// If the user already exists, their data (points, reports, etc.) is preserved.
    /// </summary>
    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? state)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_cancelled");
        }

        if (string.IsNullOrEmpty(state) || !_oauthService.ValidateOAuthState(state))
        {
            _logger.LogWarning("Invalid or missing OAuth state parameter in Google callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_invalid_state");
        }

        try
        {
            var tokenResponse = await ExchangeGoogleCodeForToken(code);
            var oauthInfo = await _oauthService.ValidateGoogleTokenAsync(tokenResponse.AccessToken);
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            var jwtToken = _jwtService.GenerateToken(user);

            return Redirect($"{GetSafeFrontendUrl()}/?token={Uri.EscapeDataString(jwtToken)}&provider=google");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Google OAuth callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_failed");
        }
    }

    /// <summary>
    /// GET /api/auth/facebook/callback
    /// 
    /// Handles Facebook OAuth callback and creates/updates user account.
    /// If the user already exists, their data (points, reports, etc.) is preserved.
    /// </summary>
    [HttpGet("facebook/callback")]
    public async Task<IActionResult> FacebookCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? state)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_cancelled");
        }

        if (string.IsNullOrEmpty(state) || !_oauthService.ValidateOAuthState(state))
        {
            _logger.LogWarning("Invalid or missing OAuth state parameter in Facebook callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_invalid_state");
        }

        try
        {
            var tokenResponse = await ExchangeFacebookCodeForToken(code);
            var oauthInfo = await _oauthService.ValidateFacebookTokenAsync(tokenResponse.AccessToken);
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            var jwtToken = _jwtService.GenerateToken(user);

            return Redirect($"{GetSafeFrontendUrl()}/?token={Uri.EscapeDataString(jwtToken)}&provider=facebook");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Facebook OAuth callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_failed");
        }
    }

    /// <summary>
    /// GET /api/auth/microsoft/callback
    /// 
    /// Handles Microsoft OAuth callback and creates/updates user account.
    /// If the user already exists, their data (points, reports, etc.) is preserved.
    /// </summary>
    [HttpGet("microsoft/callback")]
    public async Task<IActionResult> MicrosoftCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? state)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_cancelled");
        }

        if (string.IsNullOrEmpty(state) || !_oauthService.ValidateOAuthState(state))
        {
            _logger.LogWarning("Invalid or missing OAuth state parameter in Microsoft callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_invalid_state");
        }

        try
        {
            var tokenResponse = await ExchangeMicrosoftCodeForToken(code);
            var oauthInfo = await _oauthService.ValidateMicrosoftTokenAsync(tokenResponse.AccessToken);
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            var jwtToken = _jwtService.GenerateToken(user);

            return Redirect($"{GetSafeFrontendUrl()}/?token={Uri.EscapeDataString(jwtToken)}&provider=microsoft");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Microsoft OAuth callback");
            return Redirect($"{GetSafeFrontendUrl()}/?error=oauth_failed");
        }
    }

    /// <summary>
    /// POST /api/auth/validate
    /// 
    /// Validates a JWT token and returns user information.
    /// </summary>
    [HttpPost("validate")]
    public IActionResult ValidateToken([FromBody] ValidateTokenRequest request)
    {
        try
        {
            var principal = _jwtService.ValidateToken(request.Token);
            if (principal == null)
            {
                return Unauthorized("Invalid token");
            }

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var displayName = principal.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var provider = principal.FindFirst("provider")?.Value;
            var customUsername = principal.FindFirst("custom_username")?.Value;

            return Ok(new
            {
                UserId = userId,
                DisplayName = displayName,
                Email = email,
                Provider = provider,
                CustomUsername = customUsername,
                IsValid = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return Unauthorized("Invalid token");
        }
    }

    /// <summary>
    /// POST /api/auth/logout
    /// 
    /// Logs out the user by revoking OAuth tokens and clearing session.
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        try
        {
            // Validate the JWT token to get user info
            var principal = _jwtService.ValidateToken(request.Token);
            if (principal == null)
            {
                return Unauthorized("Invalid token");
            }

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var provider = principal.FindFirst("provider")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Invalid user information");
            }

            // Get user from database to access OAuth tokens
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Decrypt and revoke OAuth tokens based on provider
            if (!string.IsNullOrEmpty(user.OAuthAccessToken))
            {
                var decryptedAccessToken = _tokenEncryption.Decrypt(user.OAuthAccessToken);
                var decryptedRefreshToken = !string.IsNullOrEmpty(user.OAuthRefreshToken)
                    ? _tokenEncryption.Decrypt(user.OAuthRefreshToken)
                    : null;
                await RevokeOAuthTokens(user.OAuthProvider, decryptedAccessToken, decryptedRefreshToken);
            }

            // Clear OAuth tokens in database
            user.OAuthAccessToken = string.Empty;
            user.OAuthRefreshToken = string.Empty;
            user.OAuthTokenExpiresAt = null;
            await _userService.UpdateOAuthUserAsync(user);

            _logger.LogInformation("User {UserId} logged out successfully from provider {Provider}", userId, provider);

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, "Error during logout");
        }
    }

    /// <summary>
    /// GET /api/auth/logout-urls
    /// 
    /// Returns logout URLs for different OAuth providers.
    /// </summary>
    [HttpGet("logout-urls")]
    public IActionResult GetLogoutUrls()
    {
        var configuration = _configuration;
        
        var logoutUrls = new
        {
            Google = "https://accounts.google.com/logout",
            Facebook = "https://www.facebook.com/logout.php",
            Microsoft = "https://login.microsoftonline.com/common/oauth2/v2.0/logout"
        };

        return Ok(logoutUrls);
    }

    /// <summary>
    /// Returns a validated frontend URL from config, falling back to the production URL.
    /// Prevents open redirect by validating against allowed CORS origins.
    /// </summary>
    private string GetSafeFrontendUrl()
    {
        var configuration = _configuration;
        var frontendUrl = configuration["OAuth:FrontendUrl"]?.TrimEnd('/');

        if (string.IsNullOrEmpty(frontendUrl))
            return "https://hideandseekapp.azurewebsites.net";

        // Validate against allowed CORS origins
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "https://hideandseekapp.azurewebsites.net" };

        if (allowedOrigins.Any(o => o.Equals(frontendUrl, StringComparison.OrdinalIgnoreCase)))
            return frontendUrl;

        _logger.LogWarning("OAuth:FrontendUrl '{FrontendUrl}' is not in the allowed CORS origins, using default", frontendUrl);
        return "https://hideandseekapp.azurewebsites.net";
    }

    private async Task<User> GetOrCreateUser(OAuthUserInfo oauthInfo, string accessToken, string? refreshToken)
    {
        // Encrypt tokens before storing
        var encryptedAccessToken = _tokenEncryption.Encrypt(accessToken);
        var encryptedRefreshToken = !string.IsNullOrEmpty(refreshToken)
            ? _tokenEncryption.Encrypt(refreshToken)
            : string.Empty;

        // Try to find existing user
        var existingUser = await _userService.GetUserByOAuthAsync(oauthInfo.Provider, oauthInfo.ProviderId);

        if (existingUser != null)
        {
            // Update encrypted tokens for existing user
            existingUser.OAuthAccessToken = encryptedAccessToken;
            if (!string.IsNullOrEmpty(refreshToken))
            {
                existingUser.OAuthRefreshToken = encryptedRefreshToken;
            }
            existingUser.OAuthTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            existingUser.LastLoginDate = DateTime.UtcNow;

            // Update profile info if it changed
            if (existingUser.DisplayName != oauthInfo.DisplayName ||
                existingUser.Email != oauthInfo.Email ||
                existingUser.ProfilePictureUrl != (oauthInfo.ProfilePictureUrl ?? string.Empty))
            {
                existingUser.DisplayName = oauthInfo.DisplayName;
                existingUser.Email = oauthInfo.Email;
                existingUser.ProfilePictureUrl = oauthInfo.ProfilePictureUrl ?? string.Empty;
            }

            await _userService.UpdateOAuthUserAsync(existingUser);
            return existingUser;
        }
        else
        {
            // Create new user with encrypted tokens
            var newUser = await _userService.CreateOAuthUserAsync(oauthInfo, encryptedAccessToken, encryptedRefreshToken);
            return newUser;
        }
    }

    private async Task<TokenResponse> ExchangeGoogleCodeForToken(string code)
    {
        var configuration = _configuration;
        var clientId = configuration["OAuth:Google:ClientId"];
        var clientSecret = configuration["OAuth:Google:ClientSecret"];
        var redirectUri = configuration["OAuth:Google:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Google OAuth configuration is missing");
        }

        var httpClient = _httpClientFactory.CreateClient();
        var tokenRequest = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", clientId),
            new KeyValuePair<string, string>("client_secret", clientSecret),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("redirect_uri", redirectUri)
        });

        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google token exchange failed with status {StatusCode}", response.StatusCode);
            throw new InvalidOperationException("Google token exchange failed");
        }

        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(content);
        if (tokenResponse == null)
        {
            throw new InvalidOperationException("Invalid token response");
        }

        return tokenResponse;
    }

    private async Task<TokenResponse> ExchangeFacebookCodeForToken(string code)
    {
        var configuration = _configuration;
        var appId = configuration["OAuth:Facebook:AppId"];
        var appSecret = configuration["OAuth:Facebook:AppSecret"];
        var redirectUri = configuration["OAuth:Facebook:RedirectUri"];

        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Facebook OAuth configuration is missing");
        }

        var httpClient = _httpClientFactory.CreateClient();
        var tokenRequest = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", appId),
            new KeyValuePair<string, string>("client_secret", appSecret),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("redirect_uri", redirectUri)
        });

        var response = await httpClient.PostAsync("https://graph.facebook.com/v18.0/oauth/access_token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Facebook token exchange failed with status {StatusCode}", response.StatusCode);
            throw new InvalidOperationException("Facebook token exchange failed");
        }

        return JsonSerializer.Deserialize<TokenResponse>(content) ?? throw new InvalidOperationException("Invalid token response");
    }

    private async Task<TokenResponse> ExchangeMicrosoftCodeForToken(string code)
    {
        var configuration = _configuration;
        var clientId = configuration["OAuth:Microsoft:ClientId"];
        var clientSecret = configuration["OAuth:Microsoft:ClientSecret"];
        var redirectUri = configuration["OAuth:Microsoft:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Microsoft OAuth configuration is missing");
        }

        var httpClient = _httpClientFactory.CreateClient();
        var tokenRequest = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", clientId),
            new KeyValuePair<string, string>("client_secret", clientSecret),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("redirect_uri", redirectUri)
        });

        var response = await httpClient.PostAsync("https://login.microsoftonline.com/common/oauth2/v2.0/token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Microsoft token exchange failed with status {StatusCode}", response.StatusCode);
            throw new InvalidOperationException("Microsoft token exchange failed");
        }

        return JsonSerializer.Deserialize<TokenResponse>(content) ?? throw new InvalidOperationException("Invalid token response");
    }

    private async Task RevokeOAuthTokens(string provider, string accessToken, string? refreshToken)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            
            switch (provider.ToLower())
            {
                case "google":
                    if (!string.IsNullOrEmpty(refreshToken))
                    {
                        var configuration = _configuration;
                        var clientId = configuration["OAuth:Google:ClientId"];
                        var clientSecret = configuration["OAuth:Google:ClientSecret"];
                        
                        var revokeRequest = new FormUrlEncodedContent(new[]
                        {
                            new KeyValuePair<string, string>("token", refreshToken),
                            new KeyValuePair<string, string>("client_id", clientId),
                            new KeyValuePair<string, string>("client_secret", clientSecret)
                        });
                        
                        await httpClient.PostAsync("https://oauth2.googleapis.com/revoke", revokeRequest);
                    }
                    break;
                    
                case "facebook":
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        var configuration = _configuration;
                        var appId = configuration["OAuth:Facebook:AppId"];
                        var appSecret = configuration["OAuth:Facebook:AppSecret"];
                        
                        await httpClient.DeleteAsync($"https://graph.facebook.com/v18.0/me/permissions?access_token={accessToken}");
                    }
                    break;
                    
                case "microsoft":
                    // Microsoft doesn't have a direct token revocation endpoint
                    // The token will expire naturally
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to revoke OAuth tokens for provider {Provider}", provider);
            // Don't throw - token revocation failure shouldn't prevent logout
        }
    }
}

public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;
    
    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }
    
    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;
    
    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class LogoutRequest
{
    public string Token { get; set; } = string.Empty;
} 