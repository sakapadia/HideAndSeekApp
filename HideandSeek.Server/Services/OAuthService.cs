using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using HideandSeek.Server.Models;
using System.Net.Http.Headers;
using System.Linq;

namespace HideandSeek.Server.Services;

/// <summary>
/// Service for handling OAuth authentication with Google, Facebook, and Microsoft.
/// </summary>
public interface IOAuthService
{
    string GetGoogleAuthUrl(bool forceAccountSelection = false);
    string GetFacebookAuthUrl();
    string GetMicrosoftAuthUrl();
    Task<OAuthUserInfo> ValidateGoogleTokenAsync(string accessToken);
    Task<OAuthUserInfo> ValidateFacebookTokenAsync(string accessToken);
    Task<OAuthUserInfo> ValidateMicrosoftTokenAsync(string accessToken);
}

public class OAuthService : IOAuthService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<OAuthService> _logger;

    public OAuthService(IConfiguration configuration, HttpClient httpClient, ILogger<OAuthService> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
    }

    public string GetGoogleAuthUrl(bool forceAccountSelection = false)
    {
        var clientId = _configuration["OAuth:Google:ClientId"];
        var redirectUri = _configuration["OAuth:Google:RedirectUri"];
        
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Google OAuth configuration is missing");
        }
        
        // Corrected Scope string
        var scopeString = "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

        // Always encourage account selection; include consent to ensure refresh token issuance
        // Note: Google allows space-delimited prompt values
        var prompt = forceAccountSelection ? "select_account consent" : "select_account consent";
        
        _logger.LogInformation("🔧 DEBUG: GetGoogleAuthUrl called with forceAccountSelection = {ForceAccountSelection}", forceAccountSelection);
        _logger.LogInformation("🔧 DEBUG: Using prompt = {Prompt}", prompt);

        var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
               $"client_id={clientId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString(scopeString)}&" +
               $"access_type=offline&" +
               $"prompt={prompt}";

        _logger.LogInformation("Generated Google OAuth URL with scopes: {Scopes}", scopeString);
        _logger.LogInformation("Full Google OAuth URL: {Url}", authUrl);

        return authUrl;
    }

    public string GetFacebookAuthUrl()
    {
        var appId = _configuration["OAuth:Facebook:AppId"];
        var redirectUri = _configuration["OAuth:Facebook:RedirectUri"];
        
        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Facebook OAuth configuration is missing");
        }
        
        return $"https://www.facebook.com/v18.0/dialog/oauth?" +
               $"client_id={appId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString("email public_profile")}";
    }

    public string GetMicrosoftAuthUrl()
    {
        var clientId = _configuration["OAuth:Microsoft:ClientId"];
        var redirectUri = _configuration["OAuth:Microsoft:RedirectUri"];
        
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Microsoft OAuth configuration is missing");
        }
        
        return $"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
               $"client_id={clientId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString("openid email profile")}&" +
               $"response_mode=query";
    }

    public async Task<OAuthUserInfo> ValidateGoogleTokenAsync(string accessToken)
    {
        try
        {
            _logger.LogInformation("Validating Google token with length: {TokenLength}", accessToken.Length);
            _logger.LogInformation("Token starts with: {TokenStart}", accessToken.Substring(0, Math.Min(20, accessToken.Length)));
            
            // Use Authorization header with Bearer token (correct approach)
            var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v2/userinfo");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            
            _logger.LogInformation("Calling Google userinfo API with Authorization header");
            
            var response = await _httpClient.SendAsync(request);
            
            _logger.LogInformation("Google userinfo API response status: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Google userinfo API error: {StatusCode} - {Content}", response.StatusCode, errorContent);
                throw new InvalidOperationException($"Invalid Google access token: {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Google userinfo API response content: {Content}", content);
            
            var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(content);

            if (userInfo == null)
            {
                throw new InvalidOperationException("Invalid Google user info response");
            }

            _logger.LogInformation("Successfully parsed Google user info: {Email} - {Name}", userInfo.Email, userInfo.Name);
            _logger.LogInformation("Google user info details - Id: {Id}, Email: {Email}, Name: {Name}, Picture: {Picture}", 
                userInfo.Id, userInfo.Email, userInfo.Name, userInfo.Picture);

            return new OAuthUserInfo
            {
                Provider = "Google",
                ProviderId = userInfo.Id,
                Email = userInfo.Email,
                DisplayName = userInfo.Name,
                ProfilePictureUrl = userInfo.Picture
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Google token");
            throw;
        }
    }

    public async Task<OAuthUserInfo> ValidateFacebookTokenAsync(string accessToken)
    {
        try
        {
            var response = await _httpClient.GetAsync($"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={accessToken}");
            
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Invalid Facebook access token");
            }

            var content = await response.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<FacebookUserInfo>(content);

            if (userInfo == null)
            {
                throw new InvalidOperationException("Invalid Facebook user info response");
            }

            return new OAuthUserInfo
            {
                Provider = "Facebook",
                ProviderId = userInfo.Id,
                Email = userInfo.Email,
                DisplayName = userInfo.Name,
                ProfilePictureUrl = userInfo.Picture?.Data?.Url
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Facebook token");
            throw;
        }
    }

    public async Task<OAuthUserInfo> ValidateMicrosoftTokenAsync(string accessToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Invalid Microsoft access token");
            }

            var content = await response.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<MicrosoftUserInfo>(content);

            if (userInfo == null)
            {
                throw new InvalidOperationException("Invalid Microsoft user info response");
            }

            return new OAuthUserInfo
            {
                Provider = "Microsoft",
                ProviderId = userInfo.Id,
                Email = userInfo.UserPrincipalName,
                DisplayName = userInfo.DisplayName,
                ProfilePictureUrl = null // Microsoft Graph doesn't provide profile picture in basic endpoint
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Microsoft token");
            throw;
        }
    }
}

/// <summary>
/// User information returned from OAuth providers
/// </summary>
public class OAuthUserInfo
{
    public string Provider { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

// OAuth provider response models
public class GooglePeopleInfo
{
    public string? ResourceName { get; set; }
    public List<GooglePersonName>? Names { get; set; }
    public List<GooglePersonEmail>? EmailAddresses { get; set; }
    public List<GooglePersonPhoto>? Photos { get; set; }
}

public class GooglePersonName
{
    public string? DisplayName { get; set; }
    public string? GivenName { get; set; }
    public string? FamilyName { get; set; }
}

public class GooglePersonEmail
{
    public string? Value { get; set; }
    public string? Type { get; set; }
}

public class GooglePersonPhoto
{
    public string? Url { get; set; }
    public bool? Default { get; set; }
}

// Legacy model for backward compatibility
public class GoogleUserInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("picture")]
    public string Picture { get; set; } = string.Empty;
}

public class FacebookUserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public FacebookPicture? Picture { get; set; }
}

public class FacebookPicture
{
    public FacebookPictureData? Data { get; set; }
}

public class FacebookPictureData
{
    public string Url { get; set; } = string.Empty;
}

public class MicrosoftUserInfo
{
    public string Id { get; set; } = string.Empty;
    public string UserPrincipalName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
} 