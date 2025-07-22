using Azure.Data.Tables;

namespace HideandSeek.Server.Models;

/// <summary>
/// Represents a noise complaint report stored in Azure Table Storage.
/// Implements ITableEntity to work with Azure Data Tables SDK.
/// 
/// Partition Strategy: Uses ZIP codes as partition keys to group reports geographically.
/// This allows efficient queries by area and prevents hot partitions in most scenarios.
/// 
/// Row Key Strategy: Uses timestamp + GUID to ensure uniqueness and allow chronological ordering.
/// </summary>
public class NoiseReport : ITableEntity
{
    /// <summary>
    /// Azure Table Storage Partition Key - ZIP Code
    /// Groups all noise reports within a specific ZIP code together for efficient querying.
    /// This is the primary geographic grouping mechanism.
    /// </summary>
    public string PartitionKey { get; set; } = string.Empty;

    /// <summary>
    /// Azure Table Storage Row Key - Timestamp_GUID
    /// Format: yyyyMMddHHmmssfff_GUID (e.g., "20241201143022123_a1b2c3d4e5f6")
    /// Ensures uniqueness and allows chronological sorting within a partition.
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

    // ===== Custom Business Properties =====

    /// <summary>
    /// Geographic latitude coordinate of the noise incident.
    /// Required for map display and spatial queries.
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Geographic longitude coordinate of the noise incident.
    /// Required for map display and spatial queries.
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Detailed description of the noise complaint.
    /// Required field - provides context about the noise issue.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Category of noise (e.g., "Traffic", "Construction", "Music", "Party", "Industrial", "Other").
    /// Used for filtering and categorization in the UI.
    /// </summary>
    public string NoiseType { get; set; } = string.Empty;

    /// <summary>
    /// Subjective noise level rating on a scale of 1-10.
    /// 1-3: Low noise (Green markers)
    /// 4-6: Medium noise (Orange markers) 
    /// 7-10: High noise (Red markers)
    /// </summary>
    public int NoiseLevel { get; set; }

    /// <summary>
    /// Name of the person reporting the noise (optional).
    /// For contact purposes and accountability.
    /// </summary>
    public string ReporterName { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the person reporting the noise (optional).
    /// For follow-up communications and verification.
    /// </summary>
    public string ContactEmail { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when the noise report was submitted.
    /// Automatically set to UTC when creating new reports.
    /// </summary>
    public DateTime ReportDate { get; set; }

    /// <summary>
    /// Human-readable address of the noise incident (optional).
    /// Provides context for location when coordinates aren't sufficient.
    /// </summary>
    public string Address { get; set; } = string.Empty;
} 