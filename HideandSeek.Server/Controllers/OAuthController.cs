using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;
using System.Text.Json;
using System.Text.Json.Serialization;

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
    private readonly ILogger<OAuthController> _logger;

    public OAuthController(
        IOAuthService oauthService, 
        IUserService userService, 
        IJwtService jwtService, 
        ILogger<OAuthController> logger)
    {
        _oauthService = oauthService;
        _userService = userService;
        _jwtService = jwtService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/auth/google
    /// 
    /// Initiates Google OAuth flow by redirecting to Google's authorization URL.
    /// </summary>
    [HttpGet("google")]
    public IActionResult GoogleAuth([FromQuery] bool forceAccountSelection = false)
    {
        try
        {
            _logger.LogInformation("🔍 DEBUG: GoogleAuth called with forceAccountSelection = {ForceAccountSelection}", forceAccountSelection);
            var authUrl = _oauthService.GetGoogleAuthUrl(forceAccountSelection);
            _logger.LogInformation("🔗 DEBUG: Generated Google OAuth URL: {AuthUrl}", authUrl);
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
    public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect("/?error=oauth_cancelled");
        }

        try
        {
            _logger.LogInformation("Starting Google OAuth callback processing...");
            
            // Exchange authorization code for access token
            var tokenResponse = await ExchangeGoogleCodeForToken(code);
            _logger.LogInformation("Token exchange completed successfully");
            
            // Get user info from Google
            _logger.LogInformation("Calling ValidateGoogleTokenAsync with access token...");
            var oauthInfo = await _oauthService.ValidateGoogleTokenAsync(tokenResponse.AccessToken);
            _logger.LogInformation("Token validation completed successfully");
            
            // Find or create user
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            _logger.LogInformation("User processing completed: {UserId}", user.RowKey);
            
            // Generate JWT token
            var jwtToken = _jwtService.GenerateToken(user);
            _logger.LogInformation("JWT token generated successfully");
            
            // Update last login
            await _userService.UpdateUserLastLoginAsync(user.RowKey);
            
            // Redirect to frontend with token
            return Redirect($"https://hideandseekapp.azurewebsites.net/?token={Uri.EscapeDataString(jwtToken)}&provider=google");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Google OAuth callback: {Message}", ex.Message);
            _logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
            return Redirect($"https://hideandseekapp.azurewebsites.net/?error=oauth_failed&details={Uri.EscapeDataString(ex.Message)}");
        }
    }

    /// <summary>
    /// GET /api/auth/facebook/callback
    /// 
    /// Handles Facebook OAuth callback and creates/updates user account.
    /// If the user already exists, their data (points, reports, etc.) is preserved.
    /// </summary>
    [HttpGet("facebook/callback")]
    public async Task<IActionResult> FacebookCallback([FromQuery] string code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect("/?error=oauth_cancelled");
        }

        try
        {
            // Exchange authorization code for access token
            var tokenResponse = await ExchangeFacebookCodeForToken(code);
            
            // Get user info from Facebook
            var oauthInfo = await _oauthService.ValidateFacebookTokenAsync(tokenResponse.AccessToken);
            
            // Find or create user
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            
            // Generate JWT token
            var jwtToken = _jwtService.GenerateToken(user);
            
            // Update last login
            await _userService.UpdateUserLastLoginAsync(user.RowKey);
            
            // Redirect to frontend with token
            return Redirect($"https://hideandseekapp.azurewebsites.net/?token={Uri.EscapeDataString(jwtToken)}&provider=facebook");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Facebook OAuth callback");
            return Redirect("https://hideandseekapp.azurewebsites.net/?error=oauth_failed");
        }
    }

    /// <summary>
    /// GET /api/auth/microsoft/callback
    /// 
    /// Handles Microsoft OAuth callback and creates/updates user account.
    /// If the user already exists, their data (points, reports, etc.) is preserved.
    /// </summary>
    [HttpGet("microsoft/callback")]
    public async Task<IActionResult> MicrosoftCallback([FromQuery] string code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect("/?error=oauth_cancelled");
        }

        try
        {
            // Exchange authorization code for access token
            var tokenResponse = await ExchangeMicrosoftCodeForToken(code);
            
            // Get user info from Microsoft
            var oauthInfo = await _oauthService.ValidateMicrosoftTokenAsync(tokenResponse.AccessToken);
            
            // Find or create user
            var user = await GetOrCreateUser(oauthInfo, tokenResponse.AccessToken, tokenResponse.RefreshToken);
            
            // Generate JWT token
            var jwtToken = _jwtService.GenerateToken(user);
            
            // Update last login
            await _userService.UpdateUserLastLoginAsync(user.RowKey);
            
            // Redirect to frontend with token
            return Redirect($"https://hideandseekapp.azurewebsites.net/?token={Uri.EscapeDataString(jwtToken)}&provider=microsoft");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Microsoft OAuth callback");
            return Redirect("https://hideandseekapp.azurewebsites.net/?error=oauth_failed");
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

            // Revoke OAuth tokens based on provider
            if (!string.IsNullOrEmpty(user.OAuthAccessToken))
            {
                await RevokeOAuthTokens(user.OAuthProvider, user.OAuthAccessToken, user.OAuthRefreshToken);
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
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        
        var logoutUrls = new
        {
            Google = "https://accounts.google.com/logout",
            Facebook = "https://www.facebook.com/logout.php",
            Microsoft = "https://login.microsoftonline.com/common/oauth2/v2.0/logout"
        };

        return Ok(logoutUrls);
    }

    /// <summary>
    /// GET /api/auth/debug/user/{provider}/{providerId}
    /// 
    /// Debug endpoint to check if a user exists by OAuth provider and ID.
    /// </summary>
    [HttpGet("debug/user/{provider}/{providerId}")]
    public async Task<IActionResult> DebugUserExists(string provider, string providerId)
    {
        try
        {
            var user = await _userService.GetUserByOAuthAsync(provider, providerId);
            
            if (user != null)
            {
                return Ok(new
                {
                    Exists = true,
                    UserId = user.RowKey,
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    Points = user.Points,
                    CreatedDate = user.CreatedDate,
                    LastLoginDate = user.LastLoginDate,
                    OAuthProvider = user.OAuthProvider,
                    OAuthProviderId = user.OAuthProviderId
                });
            }
            else
            {
                return Ok(new { Exists = false });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user existence for provider: {Provider}, ProviderId: {ProviderId}", provider, providerId);
            return StatusCode(500, "Error checking user existence");
        }
    }

    /// <summary>
    /// GET /api/auth/debug/test-persistence
    /// 
    /// Test endpoint to verify user persistence functionality.
    /// </summary>
    [HttpGet("debug/test-persistence")]
    public async Task<IActionResult> TestUserPersistence()
    {
        try
        {
            // Create a test OAuth user info
            var testOAuthInfo = new OAuthUserInfo
            {
                Provider = "Test",
                ProviderId = "test_user_123",
                Email = "test@example.com",
                DisplayName = "Test User",
                ProfilePictureUrl = "https://example.com/avatar.jpg"
            };

            // Simulate creating a user
            var testUser = await _userService.CreateOAuthUserAsync(testOAuthInfo, "test_access_token", "test_refresh_token");
            
            // Try to find the user again
            var foundUser = await _userService.GetUserByOAuthAsync("Test", "test_user_123");
            
            // Clean up test user
            await _userService.DeleteUserAsync(testUser.RowKey);
            
            return Ok(new
            {
                TestPassed = foundUser != null,
                CreatedUserId = testUser.RowKey,
                FoundUserId = foundUser?.RowKey,
                Message = foundUser != null ? "User persistence test passed" : "User persistence test failed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in user persistence test");
            return StatusCode(500, "Error in user persistence test");
        }
    }

    private async Task<User> GetOrCreateUser(OAuthUserInfo oauthInfo, string accessToken, string? refreshToken)
    {
        _logger.LogInformation("Looking up user by OAuth provider: {Provider}, ProviderId: {ProviderId}", 
            oauthInfo.Provider, oauthInfo.ProviderId);
        
        // Try to find existing user
        var existingUser = await _userService.GetUserByOAuthAsync(oauthInfo.Provider, oauthInfo.ProviderId);
        
        if (existingUser != null)
        {
            _logger.LogInformation("Found existing user: {UserId}, DisplayName: {DisplayName}, Points: {Points}", 
                existingUser.RowKey, existingUser.DisplayName, existingUser.Points);
            
            // Update tokens for existing user
            existingUser.OAuthAccessToken = accessToken;
            if (!string.IsNullOrEmpty(refreshToken))
            {
                existingUser.OAuthRefreshToken = refreshToken;
            }
            existingUser.OAuthTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            existingUser.LastLoginDate = DateTime.UtcNow; // Update last login time
            
            // Update profile info if it changed
            if (existingUser.DisplayName != oauthInfo.DisplayName || 
                existingUser.Email != oauthInfo.Email ||
                existingUser.ProfilePictureUrl != (oauthInfo.ProfilePictureUrl ?? string.Empty))
            {
                _logger.LogInformation("Updating user profile information for user: {UserId}", existingUser.RowKey);
                existingUser.DisplayName = oauthInfo.DisplayName;
                existingUser.Email = oauthInfo.Email;
                existingUser.ProfilePictureUrl = oauthInfo.ProfilePictureUrl ?? string.Empty;
            }
            
            await _userService.UpdateOAuthUserAsync(existingUser);
            _logger.LogInformation("Successfully updated existing user: {UserId}", existingUser.RowKey);
            return existingUser;
        }
        else
        {
            _logger.LogInformation("No existing user found, creating new user for provider: {Provider}, ProviderId: {ProviderId}", 
                oauthInfo.Provider, oauthInfo.ProviderId);
            
            // Create new user
            var newUser = await _userService.CreateOAuthUserAsync(oauthInfo, accessToken, refreshToken);
            _logger.LogInformation("Successfully created new user: {UserId}, DisplayName: {DisplayName}", 
                newUser.RowKey, newUser.DisplayName);
            return newUser;
        }
    }

    private async Task<TokenResponse> ExchangeGoogleCodeForToken(string code)
    {
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var clientId = configuration["OAuth:Google:ClientId"];
        var clientSecret = configuration["OAuth:Google:ClientSecret"];
        var redirectUri = configuration["OAuth:Google:RedirectUri"];

        _logger.LogInformation("Google OAuth config - ClientId: {ClientId}, RedirectUri: {RedirectUri}", 
            clientId, redirectUri);
        _logger.LogInformation("Authorization code received: {CodeLength} characters", code.Length);

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Google OAuth configuration is missing");
        }

        using var httpClient = new HttpClient();
        var tokenRequest = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", clientId),
            new KeyValuePair<string, string>("client_secret", clientSecret),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("redirect_uri", redirectUri)
        });

        _logger.LogInformation("Making token exchange request to Google...");
        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();
        
        _logger.LogInformation("Google token exchange response status: {StatusCode}", response.StatusCode);
        _logger.LogInformation("Google token exchange response content: {Content}", content);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Google token exchange failed: {content}");
        }

        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(content);
        if (tokenResponse == null)
        {
            throw new InvalidOperationException("Invalid token response");
        }

        _logger.LogInformation("Google access token received: {TokenLength} characters", tokenResponse.AccessToken.Length);
        _logger.LogInformation("Access token starts with: {TokenStart}", tokenResponse.AccessToken.Substring(0, Math.Min(20, tokenResponse.AccessToken.Length)));
        _logger.LogInformation("Token type: {TokenType}", tokenResponse.TokenType);
        _logger.LogInformation("Expires in: {ExpiresIn} seconds", tokenResponse.ExpiresIn);
        
        return tokenResponse;
    }

    private async Task<TokenResponse> ExchangeFacebookCodeForToken(string code)
    {
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var appId = configuration["OAuth:Facebook:AppId"];
        var appSecret = configuration["OAuth:Facebook:AppSecret"];
        var redirectUri = configuration["OAuth:Facebook:RedirectUri"];

        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Facebook OAuth configuration is missing");
        }

        using var httpClient = new HttpClient();
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
            throw new InvalidOperationException($"Facebook token exchange failed: {content}");
        }

        return JsonSerializer.Deserialize<TokenResponse>(content) ?? throw new InvalidOperationException("Invalid token response");
    }

    private async Task<TokenResponse> ExchangeMicrosoftCodeForToken(string code)
    {
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var clientId = configuration["OAuth:Microsoft:ClientId"];
        var clientSecret = configuration["OAuth:Microsoft:ClientSecret"];
        var redirectUri = configuration["OAuth:Microsoft:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Microsoft OAuth configuration is missing");
        }

        using var httpClient = new HttpClient();
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
            throw new InvalidOperationException($"Microsoft token exchange failed: {content}");
        }

        return JsonSerializer.Deserialize<TokenResponse>(content) ?? throw new InvalidOperationException("Invalid token response");
    }

    private async Task RevokeOAuthTokens(string provider, string accessToken, string? refreshToken)
    {
        try
        {
            using var httpClient = new HttpClient();
            
            switch (provider.ToLower())
            {
                case "google":
                    if (!string.IsNullOrEmpty(refreshToken))
                    {
                        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
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
                        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
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