using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;
using Microsoft.AspNetCore.Authorization; // Added for Authorize attribute
using System.Text.RegularExpressions;
using System.Linq;

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
    private readonly IGeocodingService _geocodingService;
    private readonly ILogger<NoiseReportsController> _logger;

    /// <summary>
    /// Initializes the controller with dependency injection.
    /// </summary>
    /// <param name="tableStorageService">Service for Azure Table Storage operations</param>
    /// <param name="userService">Service for user account operations</param>
    /// <param name="logger">Logger for error tracking and debugging</param>
    public NoiseReportsController(ITableStorageService tableStorageService, IUserService userService, IGeocodingService geocodingService, ILogger<NoiseReportsController> logger)
    {
        _tableStorageService = tableStorageService;
        _userService = userService;
        _geocodingService = geocodingService;
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
            // Allow 0,0 coordinates if we have an address to geocode
            if ((reportRequest.Latitude == 0 || reportRequest.Longitude == 0) && 
                string.IsNullOrEmpty(reportRequest.StreetAddress) && 
                string.IsNullOrEmpty(reportRequest.City) && 
                string.IsNullOrEmpty(reportRequest.ZipCode))
            {
                return BadRequest("Either coordinates or address information is required");
            }

            // Generate coordinates from address if not provided
            double latitude = reportRequest.Latitude;
            double longitude = reportRequest.Longitude;
            
            if (latitude == 0 && longitude == 0 && 
                !string.IsNullOrEmpty(reportRequest.StreetAddress) && 
                !string.IsNullOrEmpty(reportRequest.City) && 
                !string.IsNullOrEmpty(reportRequest.ZipCode))
            {
                try
                {
                    // Build full address string for geocoding (include state for better accuracy)
                    var state = !string.IsNullOrEmpty(reportRequest.State) ? reportRequest.State : "WA";
                    var fullAddress = $"{reportRequest.StreetAddress}, {reportRequest.City}, {state} {reportRequest.ZipCode}";
                    
                    // Use real geocoding service to get coordinates from address
                    var coordinates = await _geocodingService.GeocodeAddressAsync(fullAddress);
                    if (coordinates.HasValue)
                    {
                        latitude = coordinates.Value.Latitude;
                        longitude = coordinates.Value.Longitude;
                        
                        _logger.LogInformation("Generated coordinates {Lat}, {Lon} from address: {Address}", 
                            latitude, longitude, fullAddress);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to geocode address: {Address}", fullAddress);
                        // Continue with 0,0 coordinates - the ZIP code will still work for partitioning
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate coordinates from address: {Address}", 
                        $"{reportRequest.StreetAddress}, {reportRequest.City}, {reportRequest.ZipCode}");
                    // Continue with 0,0 coordinates - the ZIP code will still work for partitioning
                }
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
                Latitude = latitude,
                Longitude = longitude,
                Description = reportRequest.Description,
                
                // Structured address fields
                StreetAddress = reportRequest.StreetAddress ?? string.Empty,
                City = reportRequest.City ?? string.Empty,
                State = reportRequest.State ?? string.Empty,
                ZipCode = reportRequest.ZipCode ?? string.Empty,
                Address = reportRequest.Address ?? string.Empty, // Legacy field
                
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

            // Set partition key to ZIP code if provided, otherwise determine from coordinates
            if (!string.IsNullOrEmpty(report.ZipCode))
            {
                report.PartitionKey = report.ZipCode;
            }
            else if (string.IsNullOrEmpty(report.PartitionKey))
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
            _logger.LogInformation("GetZipCodesInBounds called with: minLat={MinLat}, maxLat={MaxLat}, minLon={MinLon}, maxLon={MaxLon}", 
                minLat, maxLat, minLon, maxLon);
            
            // Get actual ZIP codes from existing noise reports in the specified bounds
            // This ensures we only query ZIP codes where we actually have data
            var bounds = new MapBounds
            {
                MinLatitude = minLat,
                MaxLatitude = maxLat,
                MinLongitude = minLon,
                MaxLongitude = maxLon,
                ZipCodes = new List<string>() // Will be populated by the service
            };

            // Get all ZIP codes from noise reports in the bounds
            var response = await _tableStorageService.GetZipCodesFromReportsAsync(bounds);
            
            // If no ZIP codes found, provide some common Seattle ZIP codes as fallback
            if (!response.Any())
            {
                _logger.LogWarning("No ZIP codes found in bounds, using fallback Seattle ZIP codes. Bounds: {Bounds}", bounds);
                var fallbackZipCodes = new List<string> { "98101", "98102", "98103", "98104", "98105", "98106", "98107", "98108", "98109", "98112", "98115", "98116", "98117", "98118", "98119", "98121", "98122", "98125", "98126", "98133", "98134", "98136", "98144", "98146", "98148", "98155", "98158", "98166", "98168", "98174", "98177", "98178", "98188", "98195", "98198", "98199" };
                return Ok(fallbackZipCodes);
            }
            
            _logger.LogInformation("Returning {ZipCodeCount} ZIP codes found in bounds: {ZipCodes}", response.Count, string.Join(",", response));
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ZIP codes for bounds: minLat={MinLat}, maxLat={MaxLat}, minLon={MinLon}, maxLon={MaxLon}", 
                minLat, maxLat, minLon, maxLon);
            return StatusCode(500, "An error occurred while retrieving ZIP codes");
        }
    }

    /// <summary>
    /// GET /api/noisereports/my-reports
    /// 
    /// Retrieves all noise reports submitted by the authenticated user.
    /// Used by the frontend to display user's report history.
    /// </summary>
    /// <returns>List of noise reports submitted by the current user</returns>
    [HttpGet("my-reports")]
    [Authorize] // Require authentication
    public async Task<ActionResult<List<NoiseReportDto>>> GetMyReports()
    {
        try
        {
            // Get username from JWT token
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized("User not authenticated");
            }

            // Get user's reports directly using username (since SubmittedBy contains username)
            var reports = await _userService.GetUserReportsAsync(username);
            
            // Convert to DTOs for frontend consumption
            var reportDtos = reports.Select(report => new NoiseReportDto
            {
                Id = report.RowKey,
                Latitude = report.Latitude,
                Longitude = report.Longitude,
                Description = report.Description,
                NoiseType = report.NoiseType,
                NoiseLevel = report.NoiseLevel,
                ReportDate = report.ReportDate,
                Address = report.Address,
                StreetAddress = report.StreetAddress,
                City = report.City,
                ZipCode = report.PartitionKey,
                BlastRadius = report.BlastRadius,
                TimeOption = report.TimeOption,
                IsRecurring = report.IsRecurring,
                PointsAwarded = report.PointsAwarded
            }).ToList();

            return Ok(reportDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reports for user: {Username}", User.Identity?.Name);
            return StatusCode(500, "An error occurred while retrieving your reports");
        }
    }

    /// <summary>
    /// DELETE /api/noisereports/{reportId}
    /// 
    /// Deletes a noise report submitted by the authenticated user.
    /// Used by the frontend to allow users to remove their reports.
    /// </summary>
    /// <param name="reportId">The RowKey of the report to delete</param>
    /// <returns>Success message if report was deleted</returns>
    [HttpDelete("{reportId}")]
    [Authorize] // Require authentication
    public async Task<ActionResult> DeleteMyReport(string reportId)
    {
        try
        {
            // Get username from JWT token
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            if (string.IsNullOrEmpty(reportId))
            {
                return BadRequest(new { message = "Report ID is required" });
            }

            // Delete the report using the user service
            var success = await _userService.DeleteUserReportAsync(username, reportId);
            
            if (!success)
            {
                return NotFound(new { message = "Report not found or you don't have permission to delete it" });
            }

            return Ok(new { message = "Report deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting report {ReportId} for user: {Username}", reportId, User.Identity?.Name);
            return StatusCode(500, new { message = "An error occurred while deleting the report" });
        }
    }


} 