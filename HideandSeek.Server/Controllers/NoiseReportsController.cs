using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;

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
    private readonly ILogger<NoiseReportsController> _logger;

    /// <summary>
    /// Initializes the controller with dependency injection.
    /// </summary>
    /// <param name="tableStorageService">Service for Azure Table Storage operations</param>
    /// <param name="logger">Logger for error tracking and debugging</param>
    public NoiseReportsController(ITableStorageService tableStorageService, ILogger<NoiseReportsController> logger)
    {
        _tableStorageService = tableStorageService;
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
    /// </summary>
    /// <param name="report">The noise report data from the frontend</param>
    /// <returns>The created noise report with generated identifiers</returns>
    [HttpPost]
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

            // Determine ZIP code from coordinates if not provided
            // This ensures proper partitioning in Azure Table Storage
            if (string.IsNullOrEmpty(report.PartitionKey))
            {
                report.PartitionKey = await _tableStorageService.GetZipCodeFromCoordinatesAsync(
                    report.Latitude, report.Longitude);
            }

            // Create the noise report in Azure Table Storage
            var createdReport = await _tableStorageService.CreateNoiseReportAsync(report);
            
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