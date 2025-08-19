using Azure.Data.Tables;
using Azure;
using System.Text.Json;

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

    // ===== LOCATION FIELDS =====

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
    /// Street name and number of the noise incident.
    /// Part of the structured address.
    /// </summary>
    public string StreetAddress { get; set; } = string.Empty;

    /// <summary>
    /// City where the noise incident occurred.
    /// Part of the structured address.
    /// </summary>
    public string City { get; set; } = string.Empty;

    /// <summary>
    /// ZIP code where the noise incident occurred.
    /// Part of the structured address and used as partition key.
    /// </summary>
    public string ZipCode { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable address of the noise incident (legacy field).
    /// Provides context for location when coordinates aren't sufficient.
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// Blast radius when exact location is unknown.
    /// Values: "Small", "Medium", "Large".
    /// </summary>
    public string BlastRadius { get; set; } = string.Empty;

    // ===== NOISE DETAILS =====

    /// <summary>
    /// Detailed description of the noise complaint.
    /// Required field - provides context about the noise issue.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Primary category of noise from the 4 specific options.
    /// Values: "Fireworks", "Protests", "Sports", "Construction".
    /// </summary>
    public string NoiseType { get; set; } = string.Empty;

    /// <summary>
    /// Array of selected noise categories from the frontend form.
    /// Stored as JSON string for Azure Table Storage compatibility.
    /// </summary>
    public string Categories { get; set; } = string.Empty;

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
    /// Username of the user who submitted this report.
    /// Used for tracking user contributions and profile history.
    /// </summary>
    public string SubmittedBy { get; set; } = string.Empty;

    /// <summary>
    /// Points awarded for this report.
    /// Users earn points for each report they submit.
    /// </summary>
    public int PointsAwarded { get; set; } = 10;

    /// <summary>
    /// Custom search text entered by the user.
    /// Used for AI-powered category matching.
    /// </summary>
    public string SearchValue { get; set; } = string.Empty;

    /// <summary>
    /// Time option selected by the user.
    /// Values: "NOW", "Morning", "Afternoon", "Evening", "Night".
    /// </summary>
    public string TimeOption { get; set; } = string.Empty;

    /// <summary>
    /// Custom date selected by the user (if not "NOW").
    /// Stored as ISO 8601 string.
    /// </summary>
    public string CustomDate { get; set; } = string.Empty;

    /// <summary>
    /// Array of custom time slots selected by the user.
    /// Stored as JSON string for Azure Table Storage compatibility.
    /// </summary>
    public string CustomSlots { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a recurring noise issue.
    /// </summary>
    public bool IsRecurring { get; set; } = false;

    /// <summary>
    /// Recurrence configuration settings.
    /// Stored as JSON string for Azure Table Storage compatibility.
    /// </summary>
    public string RecurrenceConfig { get; set; } = string.Empty;

    /// <summary>
    /// Array of media file references attached to the report.
    /// Stored as JSON string for Azure Table Storage compatibility.
    /// </summary>
    public string MediaFiles { get; set; } = string.Empty;

    // ===== HELPER METHODS =====

    /// <summary>
    /// Gets the categories as a list of strings.
    /// </summary>
    public List<string> GetCategoriesList()
    {
        if (string.IsNullOrEmpty(Categories))
            return new List<string>();
        
        try
        {
            return JsonSerializer.Deserialize<List<string>>(Categories) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the categories from a list of strings.
    /// </summary>
    public void SetCategoriesList(List<string> categories)
    {
        Categories = JsonSerializer.Serialize(categories);
    }

    /// <summary>
    /// Gets the custom slots as a list of strings.
    /// </summary>
    public List<string> GetCustomSlotsList()
    {
        if (string.IsNullOrEmpty(CustomSlots))
            return new List<string>();
        
        try
        {
            return JsonSerializer.Deserialize<List<string>>(CustomSlots) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the custom slots from a list of strings.
    /// </summary>
    public void SetCustomSlotsList(List<string> slots)
    {
        CustomSlots = JsonSerializer.Serialize(slots);
    }

    /// <summary>
    /// Gets the recurrence configuration as a dictionary.
    /// </summary>
    public Dictionary<string, object> GetRecurrenceConfig()
    {
        if (string.IsNullOrEmpty(RecurrenceConfig))
            return new Dictionary<string, object>();
        
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(RecurrenceConfig) ?? new Dictionary<string, object>();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// Sets the recurrence configuration from a dictionary.
    /// </summary>
    public void SetRecurrenceConfig(Dictionary<string, object> config)
    {
        RecurrenceConfig = JsonSerializer.Serialize(config);
    }

    /// <summary>
    /// Gets the media files as a list of strings.
    /// </summary>
    public List<string> GetMediaFilesList()
    {
        if (string.IsNullOrEmpty(MediaFiles))
            return new List<string>();
        
        try
        {
            return JsonSerializer.Deserialize<List<string>>(MediaFiles) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the media files from a list of strings.
    /// </summary>
    public void SetMediaFilesList(List<string> files)
    {
        MediaFiles = JsonSerializer.Serialize(files);
    }
} 