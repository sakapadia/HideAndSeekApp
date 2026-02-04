namespace HideandSeek.Server.Models;

/// <summary>
/// Represents the geographic bounds of a map view for querying noise reports.
/// Used to filter reports that fall within a specific rectangular area.
/// </summary>
public class MapBounds
{
    /// <summary>
    /// Minimum latitude coordinate of the bounding box.
    /// </summary>
    public double MinLatitude { get; set; }

    /// <summary>
    /// Maximum latitude coordinate of the bounding box.
    /// </summary>
    public double MaxLatitude { get; set; }

    /// <summary>
    /// Minimum longitude coordinate of the bounding box.
    /// </summary>
    public double MinLongitude { get; set; }

    /// <summary>
    /// Maximum longitude coordinate of the bounding box.
    /// </summary>
    public double MaxLongitude { get; set; }

    /// <summary>
    /// List of ZIP codes that intersect with the map bounds.
    /// Used for efficient Azure Table Storage queries by partition key.
    /// </summary>
    public List<string> ZipCodes { get; set; } = new();
}

/// <summary>
/// Request model for retrieving noise reports within specified bounds.
/// Sent from the frontend to specify the area of interest and optional filters.
/// </summary>
public class NoiseReportRequest
{
    /// <summary>
    /// Geographic bounds defining the area to search for noise reports.
    /// </summary>
    public MapBounds Bounds { get; set; } = new();

    /// <summary>
    /// Optional date filter - only return reports submitted after this date.
    /// If null, returns all reports within the bounds regardless of date.
    /// </summary>
    public DateTime? Since { get; set; }
}

/// <summary>
/// Response model containing noise reports and metadata.
/// Returned to the frontend after processing a noise report query.
/// </summary>
public class NoiseReportResponse
{
    /// <summary>
    /// List of noise reports that match the query criteria.
    /// Contains DTOs with only the necessary data for frontend display.
    /// </summary>
    public List<NoiseReportDto> Reports { get; set; } = new();

    /// <summary>
    /// Total count of reports found (useful for pagination and statistics).
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Data Transfer Object for noise reports sent to the frontend.
/// Contains only the essential data needed for map display and UI rendering.
/// Excludes sensitive information like reporter details that aren't needed in the UI.
/// </summary>
public class NoiseReportDto
{
    /// <summary>
    /// Unique identifier for the noise report (RowKey from Azure Table Storage).
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Geographic latitude coordinate for map marker placement.
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Geographic longitude coordinate for map marker placement.
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Description of the noise complaint for display in info windows.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Category of noise for filtering and categorization in the UI.
    /// </summary>
    public string NoiseType { get; set; } = string.Empty;

    /// <summary>
    /// Noise level (1-10) for determining marker color and severity display.
    /// </summary>
    public int NoiseLevel { get; set; }

    /// <summary>
    /// Date when the report was submitted for display in info windows.
    /// </summary>
    public DateTime ReportDate { get; set; }

    /// <summary>
    /// Human-readable address for additional context in info windows.
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// Street address (street name and number) for detailed location information.
    /// </summary>
    public string StreetAddress { get; set; } = string.Empty;

    /// <summary>
    /// City where the noise incident occurred for detailed location information.
    /// </summary>
    public string City { get; set; } = string.Empty;

    /// <summary>
    /// ZIP code where the noise incident occurred (PartitionKey from Azure Table Storage).
    /// Used for geographic grouping and filtering.
    /// </summary>
    public string ZipCode { get; set; } = string.Empty;

    /// <summary>
    /// Blast radius when exact location is unknown.
    /// </summary>
    public string BlastRadius { get; set; } = string.Empty;

    /// <summary>
    /// Time option when the noise occurred.
    /// </summary>
    public string TimeOption { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a recurring noise issue.
    /// </summary>
    public bool IsRecurring { get; set; }

    /// <summary>
    /// Number of points awarded for this report.
    /// </summary>
    public int PointsAwarded { get; set; }

    /// <summary>
    /// Number of upvotes this report has received from all users.
    /// </summary>
    public int Upvotes { get; set; }

    /// <summary>
    /// Custom date when the noise occurred (user-specified).
    /// </summary>
    public string CustomDate { get; set; } = string.Empty;

    /// <summary>
    /// Recurrence configuration for recurring noise reports (JSON string).
    /// </summary>
    public string RecurrenceConfig { get; set; } = string.Empty;

    /// <summary>
    /// Custom time slots for noise reports (JSON string).
    /// </summary>
    public string CustomSlots { get; set; } = string.Empty;

    /// <summary>
    /// Category-specific data for the noise report (JSON string).
    /// Contains additional fields based on the selected category/subcategory.
    /// </summary>
    public string CategorySpecificData { get; set; } = string.Empty;
} 