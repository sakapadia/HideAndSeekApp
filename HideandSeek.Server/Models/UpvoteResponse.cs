namespace HideandSeek.Server.Models;

/// <summary>
/// Response model for upvote operations.
/// Contains the current upvote count and whether the user has upvoted the report.
/// </summary>
public class UpvoteResponse
{
    /// <summary>
    /// Current number of upvotes for the report.
    /// </summary>
    public int Upvotes { get; set; }

    /// <summary>
    /// Whether the current user has upvoted this report.
    /// </summary>
    public bool HasUserUpvoted { get; set; }

    /// <summary>
    /// Optional message about the upvote operation.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

