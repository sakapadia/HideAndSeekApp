namespace HideandSeek.Server.Models;

/// <summary>
/// Request model for comprehensive noise reports from the multi-step reporting flow.
/// This model captures all the detailed information collected through the frontend form.
/// </summary>
public class ComprehensiveNoiseReportRequest
{
    // ===== LOCATION FIELDS =====
    
    /// <summary>
    /// Geographic latitude coordinate of the noise incident.
    /// Required field for map display and spatial queries.
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Geographic longitude coordinate of the noise incident.
    /// Required field for map display and spatial queries.
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Street name and number of the noise incident.
    /// Part of the structured address.
    /// </summary>
    public string? StreetAddress { get; set; }

    /// <summary>
    /// City where the noise incident occurred.
    /// Part of the structured address.
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// State where the noise incident occurred.
    /// Part of the structured address for better geocoding accuracy.
    /// </summary>
    public string? State { get; set; }

    /// <summary>
    /// ZIP code where the noise incident occurred.
    /// Part of the structured address.
    /// </summary>
    public string? ZipCode { get; set; }

    /// <summary>
    /// Human-readable address of the noise incident (legacy field).
    /// Optional but provides context for location.
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Blast radius when exact location is unknown.
    /// Values: "Small", "Medium", "Large".
    /// </summary>
    public string? BlastRadius { get; set; }

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
    public string? NoiseType { get; set; }

    /// <summary>
    /// Array of selected noise categories from the frontend form.
    /// Can include multiple categories for complex noise situations.
    /// </summary>
    public List<string>? Categories { get; set; }

    /// <summary>
    /// Custom search text entered by the user.
    /// Used for AI-powered category matching and search.
    /// </summary>
    public string? SearchValue { get; set; }

    /// <summary>
    /// Subjective noise level rating on a scale of 1-10.
    /// 1-3: Low noise, 4-6: Medium noise, 7-10: High noise.
    /// </summary>
    public int NoiseLevel { get; set; } = 5;

    // ===== TIMING FIELDS =====
    
    /// <summary>
    /// Time option selected by the user.
    /// Values: "NOW", "Morning", "Afternoon", "Evening", "Night".
    /// </summary>
    public string? TimeOption { get; set; }

    /// <summary>
    /// Custom date selected by the user (if not "NOW").
    /// Stored as ISO 8601 string.
    /// </summary>
    public string? CustomDate { get; set; }

    /// <summary>
    /// Array of custom time slots selected by the user.
    /// Used for recurring or scheduled noise issues.
    /// </summary>
    public List<string>? CustomSlots { get; set; }

    /// <summary>
    /// Whether this is a recurring noise issue.
    /// </summary>
    public bool IsRecurring { get; set; } = false;

    /// <summary>
    /// Recurrence configuration settings.
    /// Contains details about how often the noise occurs.
    /// </summary>
    public Dictionary<string, object>? RecurrenceConfig { get; set; }

    // ===== MEDIA FIELDS =====
    
    /// <summary>
    /// Array of media file references attached to the report.
    /// Can include photos, videos, or audio recordings.
    /// </summary>
    public List<string>? MediaFiles { get; set; }

    /// <summary>
    /// Category-specific data collected from the dynamic form.
    /// Contains fields specific to the selected noise category/subcategory.
    /// </summary>
    public Dictionary<string, object>? CategorySpecificData { get; set; }

    // ===== CONTACT INFORMATION =====
    
    /// <summary>
    /// Name of the person reporting the noise.
    /// Optional - for contact purposes and accountability.
    /// </summary>
    public string? ReporterName { get; set; }

    /// <summary>
    /// Email address of the person reporting the noise.
    /// Optional - for follow-up communications and verification.
    /// </summary>
    public string? ContactEmail { get; set; }
}
