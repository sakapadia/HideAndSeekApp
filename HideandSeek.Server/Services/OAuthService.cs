using System.Security.Cryptography;
using System.Text;
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
    string GetGoogleAuthUrl();
    string GetFacebookAuthUrl();
    string GetMicrosoftAuthUrl();
    bool ValidateOAuthState(string state);
    Task<OAuthUserInfo> ValidateGoogleTokenAsync(string accessToken);
    Task<OAuthUserInfo> ValidateFacebookTokenAsync(string accessToken);
    Task<OAuthUserInfo> ValidateMicrosoftTokenAsync(string accessToken);
}

public class OAuthService : IOAuthService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<OAuthService> _logger;

    private readonly byte[] _stateKey;
    private const int StateMaxAgeSeconds = 600; // 10 minutes

    public OAuthService(IConfiguration configuration, HttpClient httpClient, ILogger<OAuthService> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;

        // Derive state signing key from JWT secret (always available)
        var jwtSecret = _configuration["JwtSettings:SecretKey"] ?? "default-dev-key";
        _stateKey = HMACSHA256.HashData(Encoding.UTF8.GetBytes(jwtSecret), Encoding.UTF8.GetBytes("oauth-state-key"));
    }

    /// <summary>
    /// Generates a signed, timestamped OAuth state parameter to prevent CSRF.
    /// Format: base64(timestamp.nonce.hmac)
    /// </summary>
    private string GenerateOAuthState()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var payload = $"{timestamp}.{nonce}";
        using var hmac = new HMACSHA256(_stateKey);
        var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}.{signature}"));
    }

    /// <summary>
    /// Validates an OAuth state parameter. Returns true if the signature is valid and not expired.
    /// </summary>
    public bool ValidateOAuthState(string state)
    {
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(state));
            var parts = decoded.Split('.');
            if (parts.Length != 3) return false;

            var timestamp = parts[0];
            var nonce = parts[1];
            var signature = parts[2];

            // Verify signature
            var payload = $"{timestamp}.{nonce}";
            using var hmac = new HMACSHA256(_stateKey);
            var expectedSignature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(signature),
                    Encoding.UTF8.GetBytes(expectedSignature)))
                return false;

            // Verify not expired
            if (!long.TryParse(timestamp, out var ts)) return false;
            var age = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - ts;
            return age >= 0 && age <= StateMaxAgeSeconds;
        }
        catch
        {
            return false;
        }
    }

    public string GetGoogleAuthUrl()
    {
        var clientId = _configuration["OAuth:Google:ClientId"];
        var redirectUri = _configuration["OAuth:Google:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Google OAuth configuration is missing");
        }

        var scopeString = "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
        var state = GenerateOAuthState();

        var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
               $"client_id={clientId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString(scopeString)}&" +
               $"access_type=offline&" +
               $"prompt=select_account consent&" +
               $"state={Uri.EscapeDataString(state)}";

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

        var state = GenerateOAuthState();

        return $"https://www.facebook.com/v18.0/dialog/oauth?" +
               $"client_id={appId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString("email public_profile")}&" +
               $"state={Uri.EscapeDataString(state)}";
    }

    public string GetMicrosoftAuthUrl()
    {
        var clientId = _configuration["OAuth:Microsoft:ClientId"];
        var redirectUri = _configuration["OAuth:Microsoft:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri))
        {
            throw new InvalidOperationException("Microsoft OAuth configuration is missing");
        }

        var state = GenerateOAuthState();

        return $"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
               $"client_id={clientId}&" +
               $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
               $"response_type=code&" +
               $"scope={Uri.EscapeDataString("openid email profile")}&" +
               $"response_mode=query&" +
               $"state={Uri.EscapeDataString(state)}";
    }

    public async Task<OAuthUserInfo> ValidateGoogleTokenAsync(string accessToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v2/userinfo");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google userinfo API returned {StatusCode}", response.StatusCode);
                throw new InvalidOperationException("Invalid Google access token");
            }

            var content = await response.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(content);

            if (userInfo == null)
            {
                throw new InvalidOperationException("Invalid Google user info response");
            }

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