using System.Text.Json;

namespace HideandSeek.Server.Models;

/// <summary>
/// Represents a single comment in a noise report's comment section.
/// Each comment is associated with a user and has a timestamp.
/// </summary>
public class Comment
{
    /// <summary>
    /// Unique identifier for this comment.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The text content of the comment.
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Username of the user who made this comment.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// User ID of the user who made this comment.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when this comment was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when this comment was last modified (if applicable).
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// Whether this comment was edited after creation.
    /// </summary>
    public bool IsEdited { get; set; } = false;

    /// <summary>
    /// Whether this comment was created as part of a report merge.
    /// This helps distinguish between original descriptions and merged comments.
    /// </summary>
    public bool IsFromMerge { get; set; } = false;

    /// <summary>
    /// The original report ID if this comment came from a merged report.
    /// </summary>
    public string? OriginalReportId { get; set; }

    /// <summary>
    /// Serializes the comment to JSON for storage in Azure Table Storage.
    /// </summary>
    public string ToJson()
    {
        return JsonSerializer.Serialize(this, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    /// <summary>
    /// Deserializes a comment from JSON.
    /// </summary>
    public static Comment FromJson(string json)
    {
        if (string.IsNullOrEmpty(json))
            return new Comment();

        try
        {
            return JsonSerializer.Deserialize<Comment>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }) ?? new Comment();
        }
        catch
        {
            return new Comment();
        }
    }

    /// <summary>
    /// Creates a comment from a noise report's description.
    /// Used when converting the original description to the first comment.
    /// </summary>
    public static Comment FromDescription(string description, string username, string userId, string? originalReportId = null)
    {
        return new Comment
        {
            Id = Guid.NewGuid().ToString(),
            Text = description,
            Username = username,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsFromMerge = !string.IsNullOrEmpty(originalReportId),
            OriginalReportId = originalReportId
        };
    }
}
