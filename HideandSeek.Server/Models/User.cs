using Azure.Data.Tables;
using Azure;

namespace HideandSeek.Server.Models;

/// <summary>
/// Represents a user account stored in Azure Table Storage.
/// Implements ITableEntity to work with Azure Data Tables SDK.
/// 
/// Partition Strategy: Uses "Users" as the partition key to group all users together.
/// Row Key Strategy: Uses the OAuth provider ID as the row key for easy lookup.
/// </summary>
public class User : ITableEntity
{
    /// <summary>
    /// Azure Table Storage Partition Key - Always "Users"
    /// Groups all user accounts together for efficient querying.
    /// </summary>
    public string PartitionKey { get; set; } = "Users";

    /// <summary>
    /// Azure Table Storage Row Key - OAuth Provider ID (e.g., "google_123456789")
    /// Used as the unique identifier for the user account.
    /// </summary>
    public string RowKey { get; set; } = string.Empty;

    /// <summary>
    /// Azure Table Storage system timestamp - automatically managed by the service.
    /// </summary>
    public DateTimeOffset? Timestamp { get; set; }

    /// <summary>
    /// Azure Table Storage ETag for optimistic concurrency control.
    /// </summary>
    public ETag ETag { get; set; }

    // ===== OAuth Authentication Properties =====

    /// <summary>
    /// OAuth provider (Google, Facebook, Microsoft, etc.)
    /// </summary>
    public string OAuthProvider { get; set; } = string.Empty;

    /// <summary>
    /// Unique ID from the OAuth provider
    /// </summary>
    public string OAuthProviderId { get; set; } = string.Empty;

    /// <summary>
    /// OAuth access token (encrypted, for API calls to provider)
    /// </summary>
    public string OAuthAccessToken { get; set; } = string.Empty;

    /// <summary>
    /// OAuth refresh token (encrypted, for renewing access tokens)
    /// </summary>
    public string OAuthRefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// When the OAuth access token expires
    /// </summary>
    public DateTime? OAuthTokenExpiresAt { get; set; }

    // ===== User Account Properties =====

    /// <summary>
    /// Display name from OAuth provider (e.g., "John Doe")
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Email address from OAuth provider
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Profile picture URL from OAuth provider
    /// </summary>
    public string ProfilePictureUrl { get; set; } = string.Empty;

    /// <summary>
    /// Total points earned by the user through reporting.
    /// Points are awarded for each noise report submitted.
    /// </summary>
    public int Points { get; set; } = 0;

    /// <summary>
    /// Date when the user account was created.
    /// Automatically set when creating new accounts.
    /// </summary>
    public DateTime CreatedDate { get; set; }

    /// <summary>
    /// Date when the user last logged in.
    /// Updated on each successful login.
    /// </summary>
    public DateTime LastLoginDate { get; set; }

    /// <summary>
    /// Whether the user account is active.
    /// Inactive accounts cannot log in or submit reports.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// User's preferred timezone (optional).
    /// Used for displaying dates and times in the user's local timezone.
    /// </summary>
    public string Timezone { get; set; } = string.Empty;

    /// <summary>
    /// Custom username chosen by the user (optional)
    /// Can be different from display name for privacy
    /// </summary>
    public string CustomUsername { get; set; } = string.Empty;
} 