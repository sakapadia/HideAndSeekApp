using Azure.Data.Tables;
using HideandSeek.Server.Models;

namespace HideandSeek.Server.Services;

/// <summary>
/// Interface for Azure Table Storage operations related to noise reports.
/// Defines the contract for data access operations.
/// </summary>
public interface ITableStorageService
{
    /// <summary>
    /// Retrieves noise reports within specified geographic bounds.
    /// </summary>
    /// <param name="bounds">Geographic bounds and ZIP codes to search within</param>
    /// <param name="since">Optional date filter - only return reports after this date</param>
    /// <returns>Collection of noise reports matching the criteria</returns>
    Task<NoiseReportResponse> GetNoiseReportsAsync(MapBounds bounds, DateTime? since = null);

    /// <summary>
    /// Creates a new noise report in Azure Table Storage.
    /// </summary>
    /// <param name="report">The noise report to create</param>
    /// <returns>The created report with generated RowKey and timestamps</returns>
    Task<NoiseReport> CreateNoiseReportAsync(NoiseReport report);

    /// <summary>
    /// Determines the ZIP code for given geographic coordinates.
    /// </summary>
    /// <param name="latitude">Geographic latitude</param>
    /// <param name="longitude">Geographic longitude</param>
    /// <returns>ZIP code string for the given coordinates</returns>
    Task<string> GetZipCodeFromCoordinatesAsync(double latitude, double longitude);

    /// <summary>
    /// Gets all ZIP codes from existing noise reports within specified bounds.
    /// This ensures we only query ZIP codes where we actually have data.
    /// </summary>
    /// <param name="bounds">Geographic bounds to search within</param>
    /// <returns>List of ZIP codes that have noise reports in the specified bounds</returns>
    Task<List<string>> GetZipCodesFromReportsAsync(MapBounds bounds);

    /// <summary>
    /// Gets a specific noise report by its RowKey.
    /// </summary>
    /// <param name="reportId">The RowKey of the report to retrieve</param>
    /// <returns>The noise report if found, null otherwise</returns>
    Task<NoiseReport?> GetNoiseReportAsync(string reportId);

    /// <summary>
    /// Updates an existing noise report in Azure Table Storage.
    /// </summary>
    /// <param name="report">The noise report to update</param>
    /// <returns>The updated report</returns>
    Task<NoiseReport> UpdateNoiseReportAsync(NoiseReport report);
}

/// <summary>
/// Service for managing noise reports in Azure Table Storage.
/// Handles all data access operations with proper error handling and logging.
/// 
/// Partition Strategy: Uses ZIP codes as partition keys for geographic grouping.
/// This allows efficient queries by area and distributes data across storage nodes.
/// </summary>
public class TableStorageService : ITableStorageService
{
    private readonly TableClient _tableClient;
    private readonly ILogger<TableStorageService> _logger;

    /// <summary>
    /// Initializes the Table Storage service with configuration and logging.
    /// </summary>
    /// <param name="configuration">Application configuration containing Azure Storage settings</param>
    /// <param name="logger">Logger for error tracking and debugging</param>
    public TableStorageService(IConfiguration configuration, ILogger<TableStorageService> logger)
    {
        // Get Azure Storage connection string from configuration
        var connectionString = configuration["AzureStorage:ConnectionString"];
        var tableName = configuration["AzureStorage:TableName"] ?? "NoiseReports";
        
        // Initialize the Azure Table Storage client
        _tableClient = new TableClient(connectionString, tableName);
        _logger = logger;
    }

    /// <summary>
    /// Retrieves noise reports within specified geographic bounds.
    /// 
    /// Query Strategy:
    /// 1. Query each ZIP code in the bounds (partition-based queries)
    /// 2. Filter results by exact coordinates within bounds
    /// 3. Apply optional date filtering
    /// 4. Convert to DTOs for frontend consumption
    /// </summary>
    /// <param name="bounds">Geographic bounds and ZIP codes to search within</param>
    /// <param name="since">Optional date filter - only return reports after this date</param>
    /// <returns>Collection of noise reports matching the criteria</returns>
    public async Task<NoiseReportResponse> GetNoiseReportsAsync(MapBounds bounds, DateTime? since = null)
    {
        var reports = new List<NoiseReportDto>();
        var totalCount = 0;

        try
        {
            // Query each ZIP code in the bounds for efficient partition-based queries
            foreach (var zipCode in bounds.ZipCodes)
            {
                // Query all reports for this ZIP code (partition key)
                var query = _tableClient.QueryAsync<NoiseReport>(r => r.PartitionKey == zipCode);
                
                await foreach (var report in query)
                {
                    // Filter by coordinates within the exact bounds
                    // This handles cases where ZIP codes are larger than the map view
                    if (report.Latitude >= bounds.MinLatitude && 
                        report.Latitude <= bounds.MaxLatitude &&
                        report.Longitude >= bounds.MinLongitude && 
                        report.Longitude <= bounds.MaxLongitude)
                    {
                        // Apply optional date filtering
                        if (since == null || report.ReportDate >= since.Value)
                        {
                            // Convert to DTO for frontend consumption
                            reports.Add(new NoiseReportDto
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
                                Upvotes = report.Upvotes,
                                CustomDate = report.CustomDate ?? string.Empty,
                                RecurrenceConfig = report.RecurrenceConfig ?? string.Empty,
                                CustomSlots = report.CustomSlots ?? string.Empty
                            });
                            totalCount++;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving noise reports for bounds: {Bounds}", bounds);
            throw;
        }

        return new NoiseReportResponse
        {
            Reports = reports,
            TotalCount = totalCount
        };
    }

    /// <summary>
    /// Creates a new noise report in Azure Table Storage.
    /// 
    /// RowKey Generation: Creates a unique identifier using timestamp + GUID format.
    /// This ensures uniqueness and allows chronological sorting within partitions.
    /// </summary>
    /// <param name="report">The noise report to create</param>
    /// <returns>The created report with generated RowKey and timestamps</returns>
    public async Task<NoiseReport> CreateNoiseReportAsync(NoiseReport report)
    {
        try
        {
            // Generate unique RowKey: timestamp (yyyyMMddHHmmssfff) + GUID
            // This ensures uniqueness and allows chronological ordering
            report.RowKey = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}";
            
            // Set Azure Table Storage system timestamp
            report.Timestamp = DateTimeOffset.UtcNow;
            
            // Set business timestamp for the report
            report.ReportDate = DateTime.UtcNow;

            // Add the entity to Azure Table Storage
            await _tableClient.AddEntityAsync(report);
            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating noise report at location: {Lat}, {Lon}", 
                report.Latitude, report.Longitude);
            throw;
        }
    }

    /// <summary>
    /// Determines the ZIP code for given geographic coordinates.
    /// 
    /// NOTE: This is a simplified demo implementation that generates ZIP codes
    /// based on coordinates. In a production environment, you would:
    /// 1. Use Google Maps Geocoding API for reverse geocoding
    /// 2. Use a ZIP code database with geographic boundaries
    /// 3. Implement proper error handling for invalid coordinates
    /// </summary>
    /// <param name="latitude">Geographic latitude</param>
    /// <param name="longitude">Geographic longitude</param>
    /// <returns>ZIP code string for the given coordinates</returns>
    public async Task<string> GetZipCodeFromCoordinatesAsync(double latitude, double longitude)
    {
        // DEMO IMPLEMENTATION - NOT FOR PRODUCTION USE
        // 
        // In a real application, you would use:
        // 1. Google Maps Geocoding API:
        //    https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
        // 
        // 2. ZIP code database with geographic boundaries:
        //    - USPS ZIP code database
        //    - Open-source ZIP code boundary data
        //    - Commercial geocoding services
        // 
        // 3. Proper error handling for:
        //    - Invalid coordinates
        //    - Coordinates outside supported regions
        //    - API rate limits and failures
        
        // Simple algorithm to generate a demo ZIP code based on coordinates
        // This is NOT accurate and should be replaced with real geocoding
        var latInt = (int)(latitude * 1000);
        var lonInt = (int)(longitude * 1000);
        var zipCode = Math.Abs(latInt + lonInt) % 99999;
        
        return zipCode.ToString("D5");
    }

    /// <summary>
    /// Gets all ZIP codes from existing noise reports within specified bounds.
    /// This ensures we only query ZIP codes where we actually have data.
    /// </summary>
    /// <param name="bounds">Geographic bounds to search within</param>
    /// <returns>List of ZIP codes that have noise reports in the specified bounds</returns>
    public async Task<List<string>> GetZipCodesFromReportsAsync(MapBounds bounds)
    {
        var zipCodes = new HashSet<string>(); // Use HashSet to avoid duplicates
        var totalReports = 0;
        var reportsInBounds = 0;

        try
        {
            // Query all noise reports in the table (since we need to find ZIP codes)
            // In a production environment, you might want to maintain a separate ZIP code index
            var query = _tableClient.QueryAsync<NoiseReport>();
            
            await foreach (var report in query)
            {
                totalReports++;
                
                // Log some sample reports to see what's in the database
                if (totalReports <= 5)
                {
                    _logger.LogInformation("Sample report {ReportNum}: Lat={Lat}, Lon={Lon}, ZIP={Zip}, Address={Address}", 
                        totalReports, report.Latitude, report.Longitude, report.PartitionKey, report.StreetAddress);
                }
                
                // Check if the report is within the specified bounds
                if (report.Latitude >= bounds.MinLatitude && 
                    report.Latitude <= bounds.MaxLatitude &&
                    report.Longitude >= bounds.MinLongitude && 
                    report.Longitude <= bounds.MaxLongitude)
                {
                    reportsInBounds++;
                    // Add the ZIP code from this report
                    if (!string.IsNullOrEmpty(report.PartitionKey))
                    {
                        zipCodes.Add(report.PartitionKey);
                    }
                }
            }

            _logger.LogInformation("Database contains {TotalReports} total reports, {ReportsInBounds} reports in bounds, {ZipCodeCount} unique ZIP codes in bounds: {Bounds}", 
                totalReports, reportsInBounds, zipCodes.Count, bounds);
            
            return zipCodes.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ZIP codes from reports for bounds: {Bounds}", bounds);
            throw;
        }
    }

    /// <summary>
    /// Gets a specific noise report by its RowKey.
    /// </summary>
    /// <param name="reportId">The RowKey of the report to retrieve</param>
    /// <returns>The noise report if found, null otherwise</returns>
    public async Task<NoiseReport?> GetNoiseReportAsync(string reportId)
    {
        try
        {
            // We need to search across all partitions since we only have the RowKey
            // In a production environment, you might want to maintain a separate index
            var query = _tableClient.QueryAsync<NoiseReport>(filter: $"RowKey eq '{reportId}'");
            
            await foreach (var report in query)
            {
                return report; // Return the first match (RowKey should be unique)
            }
            
            return null; // Report not found
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving noise report with ID: {ReportId}", reportId);
            throw;
        }
    }

    /// <summary>
    /// Updates an existing noise report in Azure Table Storage.
    /// </summary>
    /// <param name="report">The noise report to update</param>
    /// <returns>The updated report</returns>
    public async Task<NoiseReport> UpdateNoiseReportAsync(NoiseReport report)
    {
        try
        {
            await _tableClient.UpdateEntityAsync(report, report.ETag);
            _logger.LogInformation("Updated noise report {ReportId} in partition {PartitionKey}", 
                report.RowKey, report.PartitionKey);
            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating noise report {ReportId} in partition {PartitionKey}", 
                report.RowKey, report.PartitionKey);
            throw;
        }
    }
} 