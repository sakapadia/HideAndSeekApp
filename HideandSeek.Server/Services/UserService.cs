using Azure.Data.Tables;
using Azure;
using HideandSeek.Server.Models;
using Microsoft.Extensions.Configuration;

namespace HideandSeek.Server.Services;

/// <summary>
/// Service for managing OAuth user accounts and authentication.
/// Handles user creation, profile management, and points tracking.
/// </summary>
public interface IUserService
{
    Task<User?> GetUserByOAuthAsync(string provider, string providerId);
    Task<User> CreateOAuthUserAsync(OAuthUserInfo oauthInfo, string accessToken, string? refreshToken = null);
    Task<User> UpdateOAuthUserAsync(User user);
    Task<List<NoiseReport>> GetUserReportsAsync(string username);
    Task<bool> DeleteUserReportAsync(string username, string reportRowKey);
    Task<int> AwardPointsAsync(string username, int points);
    Task<bool> DeleteUserAsync(string username);
    Task<List<User>> GetAllUsersAsync();
    Task<User?> GetUserByIdAsync(string userId);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<User> UpdateUserLastLoginAsync(string userId);
}

public class UserService : IUserService
{
    private readonly TableClient _userTableClient;
    private readonly TableClient _noiseReportTableClient;
    private readonly ILogger<UserService> _logger;

    public UserService(IConfiguration configuration, ILogger<UserService> logger)
    {
        var connectionString = configuration.GetConnectionString("AzureTableStorage");
        _userTableClient = new TableClient(connectionString, "Users");
        _noiseReportTableClient = new TableClient(connectionString, "NoiseReports");
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a user by OAuth provider and provider ID.
    /// </summary>
    public async Task<User?> GetUserByOAuthAsync(string provider, string providerId)
    {
        try
        {
            var rowKey = $"{provider.ToLower()}_{providerId}";
            var response = await _userTableClient.GetEntityAsync<User>("Users", rowKey);
            return response.Value;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            return null; // User not found
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving OAuth user: {Provider} {ProviderId}", provider, providerId);
            throw;
        }
    }

    /// <summary>
    /// Creates a new user account from OAuth information.
    /// </summary>
    public async Task<User> CreateOAuthUserAsync(OAuthUserInfo oauthInfo, string accessToken, string? refreshToken = null)
    {
        try
        {
            var rowKey = $"{oauthInfo.Provider.ToLower()}_{oauthInfo.ProviderId}";
            
            // Check if user already exists
            var existingUser = await GetUserByOAuthAsync(oauthInfo.Provider, oauthInfo.ProviderId);
            if (existingUser != null)
            {
                throw new InvalidOperationException("User already exists with this OAuth account");
            }

            var user = new User
            {
                RowKey = rowKey,
                OAuthProvider = oauthInfo.Provider,
                OAuthProviderId = oauthInfo.ProviderId,
                OAuthAccessToken = accessToken,
                OAuthRefreshToken = refreshToken ?? string.Empty,
                OAuthTokenExpiresAt = DateTime.UtcNow.AddHours(1), // Default 1 hour expiry
                Email = oauthInfo.Email,
                DisplayName = oauthInfo.DisplayName,
                ProfilePictureUrl = oauthInfo.ProfilePictureUrl ?? string.Empty,
                CustomUsername = string.Empty, // User can set this later
                Points = 0,
                CreatedDate = DateTime.UtcNow,
                LastLoginDate = DateTime.UtcNow,
                IsActive = true,
                Timezone = string.Empty
            };

            await _userTableClient.AddEntityAsync(user);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating OAuth user: {Provider} {ProviderId}", oauthInfo.Provider, oauthInfo.ProviderId);
            throw;
        }
    }

    /// <summary>
    /// Updates OAuth user information.
    /// </summary>
    public async Task<User> UpdateOAuthUserAsync(User user)
    {
        try
        {
            await _userTableClient.UpdateEntityAsync(user, ETag.All, TableUpdateMode.Replace);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating OAuth user: {RowKey}", user.RowKey);
            throw;
        }
    }

    /// <summary>
    /// Retrieves a user by their unique ID (RowKey).
    /// </summary>
    public async Task<User?> GetUserByIdAsync(string userId)
    {
        try
        {
            var response = await _userTableClient.GetEntityAsync<User>("Users", userId);
            return response.Value;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            return null; // User not found
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by ID: {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Retrieves a user by their username (DisplayName or CustomUsername).
    /// </summary>
    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        try
        {
            // Query for users with matching DisplayName or CustomUsername
            var query = _userTableClient.QueryAsync<User>(u => 
                u.PartitionKey == "Users" && 
                (u.DisplayName == username || u.CustomUsername == username));
            
            await foreach (var user in query)
            {
                return user; // Return first match
            }
            
            return null; // No user found
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by username: {Username}", username);
            throw;
        }
    }

    /// <summary>
    /// Updates the last login date for a user.
    /// </summary>
    public async Task<User> UpdateUserLastLoginAsync(string userId)
    {
        try
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            user.LastLoginDate = DateTime.UtcNow;
            await UpdateOAuthUserAsync(user);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last login for user: {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Retrieves all reports submitted by a specific user.
    /// </summary>
    public async Task<List<NoiseReport>> GetUserReportsAsync(string username)
    {
        try
        {
            var reports = new List<NoiseReport>();
            var query = _noiseReportTableClient.QueryAsync<NoiseReport>(
                filter: $"SubmittedBy eq '{username}'"
            );

            await foreach (var report in query)
            {
                reports.Add(report);
            }

            return reports.OrderByDescending(r => r.ReportDate).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reports for user: {Username}", username);
            throw;
        }
    }

    /// <summary>
    /// Deletes a specific report submitted by a user.
    /// </summary>
    public async Task<bool> DeleteUserReportAsync(string username, string reportRowKey)
    {
        try
        {
            // First, find the report by querying across all partitions since we don't know the partition key
            var reports = new List<NoiseReport>();
            var query = _noiseReportTableClient.QueryAsync<NoiseReport>(
                filter: $"RowKey eq '{reportRowKey}' and SubmittedBy eq '{username}'"
            );

            await foreach (var report in query)
            {
                reports.Add(report);
            }

            if (reports.Count == 0)
            {
                return false; // Report not found or user doesn't own it
            }

            var reportToDelete = reports.First();

            // Delete the report using the correct partition key (ZIP code)
            await _noiseReportTableClient.DeleteEntityAsync(reportToDelete.PartitionKey, reportRowKey);

            // Deduct points from user
            var user = await GetUserByUsernameAsync(username);
            if (user != null)
            {
                user.Points = Math.Max(0, user.Points - reportToDelete.PointsAwarded);
                await UpdateOAuthUserAsync(user);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting report for user: {Username}, Report: {ReportRowKey}", 
                username, reportRowKey);
            return false;
        }
    }

    /// <summary>
    /// Awards points to a user and updates their total.
    /// </summary>
    public async Task<int> AwardPointsAsync(string username, int points)
    {
        try
        {
            var user = await GetUserByUsernameAsync(username);
            if (user == null)
            {
                throw new InvalidOperationException($"User not found with username: {username}");
            }

            user.Points += points;
            await UpdateOAuthUserAsync(user);
            return user.Points;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error awarding points to user: {Username}, Points: {Points}", 
                username, points);
            throw;
        }
    }

    /// <summary>
    /// Deletes a user account and all associated data.
    /// </summary>
    public async Task<bool> DeleteUserAsync(string username)
    {
        try
        {
            // Delete all reports by this user
            var userReports = await GetUserReportsAsync(username);
            foreach (var report in userReports)
            {
                await _noiseReportTableClient.DeleteEntityAsync(report.PartitionKey, report.RowKey);
            }

            // Get the user to find their RowKey
            var user = await GetUserByUsernameAsync(username);
            if (user != null)
            {
                // Delete the user account
                await _userTableClient.DeleteEntityAsync("Users", user.RowKey);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {Username}", username);
            return false;
        }
    }

    /// <summary>
    /// Retrieves all users from Azure Table Storage.
    /// Used for debugging and administration purposes.
    /// </summary>
    public async Task<List<User>> GetAllUsersAsync()
    {
        try
        {
            var users = new List<User>();
            var query = _userTableClient.QueryAsync<User>(u => u.PartitionKey == "Users");
            
            await foreach (var user in query)
            {
                users.Add(user);
            }
            
            return users.OrderBy(u => u.DisplayName).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users");
            throw;
        }
    }
} 