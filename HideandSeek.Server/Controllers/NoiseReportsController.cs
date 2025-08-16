using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;
using Microsoft.AspNetCore.Authorization; // Added for Authorize attribute

namespace HideandSeek.Server.Controllers;

/// <summary>
/// API controller for managing noise reports.
/// Provides RESTful endpoints for creating and retrieving noise complaints.
/// 
/// Base Route: /api/noisereports
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NoiseReportsController : ControllerBase
{
    private readonly ITableStorageService _tableStorageService;
    private readonly IUserService _userService;
    private readonly ILogger<NoiseReportsController> _logger;

    /// <summary>
    /// Initializes the controller with dependency injection.
    /// </summary>
    /// <param name="tableStorageService">Service for Azure Table Storage operations</param>
    /// <param name="userService">Service for user account operations</param>
    /// <param name="logger">Logger for error tracking and debugging</param>
    public NoiseReportsController(ITableStorageService tableStorageService, IUserService userService, ILogger<NoiseReportsController> logger)
    {
        _tableStorageService = tableStorageService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/noisereports
    /// 
    /// Retrieves noise reports within specified geographic bounds.
    /// Used by the frontend to display noise reports on the map.
    /// 
    /// Query Parameters:
    /// - minLat, maxLat, minLon, maxLon: Define the map view bounds
    /// - zipCodes: Comma-separated list of ZIP codes in the view (optional)
    /// - since: Optional date filter for reports (optional)
    /// </summary>
    /// <param name="minLat">Minimum latitude of the map bounds</param>
    /// <param name="maxLat">Maximum latitude of the map bounds</param>
    /// <param name="minLon">Minimum longitude of the map bounds</param>
    /// <param name="maxLon">Maximum longitude of the map bounds</param>
    /// <param name="zipCodes">Comma-separated ZIP codes in the map view</param>
    /// <param name="since">Optional date filter - only return reports after this date</param>
    /// <returns>Collection of noise reports within the specified bounds</returns>
    [HttpGet]
    public async Task<ActionResult<NoiseReportResponse>> GetNoiseReports(
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLon,
        [FromQuery] double maxLon,
        [FromQuery] string? zipCodes,
        [FromQuery] DateTime? since)
    {
        try
        {
            // Build the map bounds object from query parameters
            var bounds = new MapBounds
            {
                MinLatitude = minLat,
                MaxLatitude = maxLat,
                MinLongitude = minLon,
                MaxLongitude = maxLon,
                // Parse comma-separated ZIP codes into a list
                ZipCodes = !string.IsNullOrEmpty(zipCodes) 
                    ? zipCodes.Split(',').Select(z => z.Trim()).ToList() 
                    : new List<string>()
            };

            // Retrieve noise reports from the storage service
            var response = await _tableStorageService.GetNoiseReportsAsync(bounds, since);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving noise reports for bounds: minLat={MinLat}, maxLat={MaxLat}, minLon={MinLon}, maxLon={MaxLon}", 
                minLat, maxLat, minLon, maxLon);
            return StatusCode(500, "An error occurred while retrieving noise reports");
        }
    }

    /// <summary>
    /// POST /api/noisereports
    /// 
    /// Creates a new noise report.
    /// Used by the frontend when users submit noise complaints.
    /// 
    /// The report will be stored in Azure Table Storage with:
    /// - PartitionKey: ZIP code (determined from coordinates if not provided)
    /// - RowKey: Auto-generated timestamp + GUID for uniqueness
    /// - All other properties from the request body
    /// - SubmittedBy: Username of the user who submitted the report (from JWT token)
    /// - PointsAwarded: Points awarded for this report (default: 10)
    /// </summary>
    /// <param name="report">The noise report data from the frontend</param>
    /// <returns>The created noise report with generated identifiers</returns>
    [HttpPost]
    [Authorize] // Require authentication
    public async Task<ActionResult<NoiseReport>> CreateNoiseReport([FromBody] NoiseReport report)
    {
        try
        {
            // Validate that the request contains data
            if (report == null)
            {
                return BadRequest("Noise report data is required");
            }

            // Validate required geographic coordinates
            if (report.Latitude == 0 || report.Longitude == 0)
            {
                return BadRequest("Latitude and longitude are required");
            }

            // Validate required description
            if (string.IsNullOrEmpty(report.Description))
            {
                return BadRequest("Description is required");
            }

            // Get username from JWT token
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized("User not authenticated");
            }

            // Set user information from JWT token
            report.SubmittedBy = username;
            report.PointsAwarded = 10; // Default points for each report
            report.ReportDate = DateTime.UtcNow; // Set current timestamp

            // Set default values for new fields if not provided
            if (string.IsNullOrEmpty(report.Categories))
            {
                report.SetCategoriesList(new List<string> { report.NoiseType });
            }
            
            if (string.IsNullOrEmpty(report.TimeOption))
            {
                report.TimeOption = "NOW";
            }

            // Determine ZIP code from coordinates if not provided
            // This ensures proper partitioning in Azure Table Storage
            if (string.IsNullOrEmpty(report.PartitionKey))
            {
                report.PartitionKey = await _tableStorageService.GetZipCodeFromCoordinatesAsync(
                    report.Latitude, report.Longitude);
            }

            // Create the noise report in Azure Table Storage
            var createdReport = await _tableStorageService.CreateNoiseReportAsync(report);
            
            // Award points to user
            try
            {
                await _userService.AwardPointsAsync(username, report.PointsAwarded);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to award points to user {Username} for report {ReportId}", 
                    username, createdReport.RowKey);
                // Don't fail the report creation if points awarding fails
            }
            
            // Return 201 Created with the location of the new resource
            return CreatedAtAction(nameof(GetNoiseReports), new { id = createdReport.RowKey }, createdReport);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating noise report at location: {Lat}, {Lon}", 
                report?.Latitude, report?.Longitude);
            return StatusCode(500, "An error occurred while creating the noise report");
        }
    }

    /// <summary>
    /// POST /api/noisereports/comprehensive
    /// 
    /// Creates a comprehensive noise report from the multi-step reporting flow.
    /// This endpoint handles all the detailed fields collected through the frontend form.
    /// 
    /// The report will be stored in Azure Table Storage with:
    /// - PartitionKey: ZIP code (determined from coordinates if not provided)
    /// - RowKey: Auto-generated timestamp + GUID for uniqueness
    /// - All properties from the comprehensive reporting flow
    /// - SubmittedBy: Username of the user who submitted the report (from JWT token)
    /// - PointsAwarded: Points awarded for this report (default: 10)
    /// </summary>
    /// <param name="reportRequest">The comprehensive noise report data from the frontend</param>
    /// <returns>The created noise report with generated identifiers</returns>
    [HttpPost("comprehensive")]
    [Authorize] // Require authentication
    public async Task<ActionResult<NoiseReport>> CreateComprehensiveNoiseReport([FromBody] ComprehensiveNoiseReportRequest reportRequest)
    {
        try
        {
            // Validate that the request contains data
            if (reportRequest == null)
            {
                return BadRequest("Comprehensive noise report data is required");
            }

            // Validate required geographic coordinates
            if (reportRequest.Latitude == 0 || reportRequest.Longitude == 0)
            {
                return BadRequest("Latitude and longitude are required");
            }

            // Validate required description
            if (string.IsNullOrEmpty(reportRequest.Description))
            {
                return BadRequest("Description is required");
            }

            // Get username from JWT token
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized("User not authenticated");
            }

            // Create the NoiseReport entity from the request
            var report = new NoiseReport
            {
                // Basic location and description
                Latitude = reportRequest.Latitude,
                Longitude = reportRequest.Longitude,
                Description = reportRequest.Description,
                Address = reportRequest.Address ?? string.Empty,
                
                // User information
                SubmittedBy = username,
                ReporterName = reportRequest.ReporterName ?? string.Empty,
                ContactEmail = reportRequest.ContactEmail ?? string.Empty,
                
                // Noise details
                NoiseType = reportRequest.NoiseType ?? "Other",
                NoiseLevel = reportRequest.NoiseLevel,
                
                // New comprehensive fields
                SearchValue = reportRequest.SearchValue ?? string.Empty,
                BlastRadius = reportRequest.BlastRadius ?? string.Empty,
                TimeOption = reportRequest.TimeOption ?? "NOW",
                CustomDate = reportRequest.CustomDate ?? string.Empty,
                IsRecurring = reportRequest.IsRecurring,
                
                // Set JSON fields using helper methods
                ReportDate = DateTime.UtcNow,
                PointsAwarded = 10
            };

            // Set categories
            if (reportRequest.Categories != null && reportRequest.Categories.Count > 0)
            {
                report.SetCategoriesList(reportRequest.Categories);
            }
            else
            {
                report.SetCategoriesList(new List<string> { report.NoiseType });
            }

            // Set custom time slots
            if (reportRequest.CustomSlots != null && reportRequest.CustomSlots.Count > 0)
            {
                report.SetCustomSlotsList(reportRequest.CustomSlots);
            }

            // Set recurrence configuration
            if (reportRequest.RecurrenceConfig != null && reportRequest.RecurrenceConfig.Count > 0)
            {
                report.SetRecurrenceConfig(reportRequest.RecurrenceConfig);
            }

            // Set media files
            if (reportRequest.MediaFiles != null && reportRequest.MediaFiles.Count > 0)
            {
                report.SetMediaFilesList(reportRequest.MediaFiles);
            }

            // Determine ZIP code from coordinates if not provided
            if (string.IsNullOrEmpty(report.PartitionKey))
            {
                report.PartitionKey = await _tableStorageService.GetZipCodeFromCoordinatesAsync(
                    report.Latitude, report.Longitude);
            }

            // Create the noise report in Azure Table Storage
            var createdReport = await _tableStorageService.CreateNoiseReportAsync(report);
            
            // Award points to user
            try
            {
                await _userService.AwardPointsAsync(username, report.PointsAwarded);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to award points to user {Username} for comprehensive report {ReportId}", 
                    username, createdReport.RowKey);
                // Don't fail the report creation if points awarding fails
            }
            
            // Return 201 Created with the location of the new resource
            return CreatedAtAction(nameof(GetNoiseReports), new { id = createdReport.RowKey }, createdReport);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comprehensive noise report at location: {Lat}, {Lon}", 
                reportRequest?.Latitude, reportRequest?.Longitude);
            return StatusCode(500, "An error occurred while creating the comprehensive noise report");
        }
    }

    /// <summary>
    /// GET /api/noisereports/zipcodes
    /// 
    /// Retrieves ZIP codes that intersect with the specified map bounds.
    /// Used by the frontend to determine which ZIP codes to query for noise reports.
    /// 
    /// NOTE: This is a simplified demo implementation that generates ZIP codes
    /// based on a grid within the bounds. In production, you would use a proper
    /// ZIP code database or geocoding service.
    /// </summary>
    /// <param name="minLat">Minimum latitude of the map bounds</param>
    /// <param name="maxLat">Maximum latitude of the map bounds</param>
    /// <param name="minLon">Minimum longitude of the map bounds</param>
    /// <param name="maxLon">Maximum longitude of the map bounds</param>
    /// <returns>List of ZIP codes that intersect with the specified bounds</returns>
    [HttpGet("zipcodes")]
    public async Task<ActionResult<List<string>>> GetZipCodesInBounds(
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLon,
        [FromQuery] double maxLon)
    {
        try
        {
            // DEMO IMPLEMENTATION - NOT FOR PRODUCTION USE
            // 
            // In a real application, you would:
            // 1. Query a ZIP code database with geographic boundaries
            // 2. Use a geocoding service to find ZIP codes in the area
            // 3. Implement proper spatial indexing for efficient queries
            // 4. Handle edge cases like coordinates outside supported regions
            
            var zipCodes = new List<string>();
            
            // Generate a 5x5 grid of sample ZIP codes within the bounds
            // This is for demo purposes only and should be replaced with real data
            var latStep = (maxLat - minLat) / 5;
            var lonStep = (maxLon - minLon) / 5;
            
            for (int i = 0; i < 5; i++)
            {
                for (int j = 0; j < 5; j++)
                {
                    // Calculate coordinates for this grid cell
                    var lat = minLat + (i * latStep);
                    var lon = minLon + (j * lonStep);
                    
                    // Generate a ZIP code for these coordinates
                    var zipCode = await _tableStorageService.GetZipCodeFromCoordinatesAsync(lat, lon);
                    
                    // Avoid duplicates
                    if (!zipCodes.Contains(zipCode))
                    {
                        zipCodes.Add(zipCode);
                    }
                }
            }
            
            return Ok(zipCodes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ZIP codes for bounds: minLat={MinLat}, maxLat={MaxLat}, minLon={MinLon}, maxLon={MaxLon}", 
                minLat, maxLat, minLon, maxLon);
            return StatusCode(500, "An error occurred while retrieving ZIP codes");
        }
    }
} 