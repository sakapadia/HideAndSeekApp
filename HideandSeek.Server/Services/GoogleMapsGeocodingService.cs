using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HideandSeek.Server.Services;

/// <summary>
/// Google Maps Geocoding API service implementation.
/// Converts addresses to coordinates and vice versa using Google's geocoding service.
/// </summary>
public class GoogleMapsGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleMapsGeocodingService> _logger;
    private readonly string _apiKey;

    public GoogleMapsGeocodingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleMapsGeocodingService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = _configuration["GoogleMaps:ApiKey"];
        
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Google Maps API key not configured. Geocoding will not work.");
        }
    }

    /// <summary>
    /// Converts an address string to geographic coordinates using Google Maps Geocoding API.
    /// </summary>
    /// <param name="address">The address to geocode</param>
    /// <returns>Coordinates (latitude, longitude) for the address, or null if geocoding fails</returns>
    public async Task<(double Latitude, double Longitude)?> GeocodeAddressAsync(string address)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Cannot geocode address '{Address}' - Google Maps API key not configured", address);
            return null;
        }

        try
        {
            _logger.LogInformation("Geocoding address: {Address}", address);
            
            // Build the Google Maps Geocoding API URL
            var encodedAddress = Uri.EscapeDataString(address);
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={encodedAddress}&key={_apiKey}";
            
            // Make the API request
            var response = await _httpClient.GetStringAsync(url);
            _logger.LogInformation("Raw Google Maps response: {Response}", response);
            
            var result = JsonSerializer.Deserialize<GoogleGeocodingResponse>(response);
            _logger.LogInformation("Parsed response - Status: '{Status}', Results count: {ResultsCount}", 
                result?.Status ?? "NULL", result?.Results?.Length ?? 0);
            
            if (result?.Status == "OK" && result.Results?.Length > 0)
            {
                var location = result.Results[0].Geometry.Location;
                var coordinates = (location.Lat, location.Lng);
                
                _logger.LogInformation("Successfully geocoded '{Address}' to coordinates: {Lat}, {Lng}", 
                    address, coordinates.Lat, coordinates.Lng);
                
                return coordinates;
            }
            else
            {
                var status = result?.Status ?? "NULL";
                var resultsCount = result?.Results?.Length ?? 0;
                
                _logger.LogWarning("Geocoding failed for address '{Address}'. Status: '{Status}', Results count: {ResultsCount}", 
                    address, status, resultsCount);
                
                // Log specific error details for common failure cases
                switch (status)
                {
                    case "ZERO_RESULTS":
                        _logger.LogWarning("No results found for address: {Address}", address);
                        break;
                    case "OVER_QUERY_LIMIT":
                        _logger.LogError("Google Maps API quota exceeded for address: {Address}", address);
                        break;
                    case "REQUEST_DENIED":
                        _logger.LogError("Google Maps API request denied for address: {Address}. Check API key and billing.", address);
                        break;
                    case "INVALID_REQUEST":
                        _logger.LogWarning("Invalid request format for address: {Address}", address);
                        break;
                    default:
                        _logger.LogWarning("Unknown Google Maps API status '{Status}' for address: {Address}", status, address);
                        break;
                }
                
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error geocoding address: {Address}", address);
            return null;
        }
    }

    /// <summary>
    /// Converts coordinates to an address using Google Maps Reverse Geocoding API.
    /// </summary>
    /// <param name="latitude">Latitude coordinate</param>
    /// <param name="longitude">Longitude coordinate</param>
    /// <returns>Formatted address string, or null if reverse geocoding fails</returns>
    public async Task<string?> ReverseGeocodeAsync(double latitude, double longitude)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Cannot reverse geocode coordinates {Lat}, {Lng} - Google Maps API key not configured", latitude, longitude);
            return null;
        }

        try
        {
            _logger.LogInformation("Reverse geocoding coordinates: {Lat}, {Lng}", latitude, longitude);
            
            // Build the Google Maps Reverse Geocoding API URL
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={_apiKey}";
            
            // Make the API request
            var response = await _httpClient.GetStringAsync(url);
            var result = JsonSerializer.Deserialize<GoogleGeocodingResponse>(response);
            
            if (result?.Status == "OK" && result.Results?.Length > 0)
            {
                var address = result.Results[0].FormattedAddress;
                
                _logger.LogInformation("Successfully reverse geocoded coordinates {Lat}, {Lng} to address: {Address}", 
                    latitude, longitude, address);
                
                return address;
            }
            else
            {
                _logger.LogWarning("Reverse geocoding failed for coordinates {Lat}, {Lng}. Status: {Status}", 
                    latitude, longitude, result?.Status ?? "Unknown");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverse geocoding coordinates: {Lat}, {Lng}", latitude, longitude);
            return null;
        }
    }
}

/// <summary>
/// Response models for Google Maps Geocoding API.
/// </summary>
public class GoogleGeocodingResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("results")]
    public GoogleGeocodingResult[]? Results { get; set; }
}

public class GoogleGeocodingResult
{
    [JsonPropertyName("geometry")]
    public GoogleGeometry Geometry { get; set; } = new();
    
    [JsonPropertyName("formatted_address")]
    public string FormattedAddress { get; set; } = string.Empty;
}

public class GoogleGeometry
{
    [JsonPropertyName("location")]
    public GoogleLocation Location { get; set; } = new();
}

public class GoogleLocation
{
    [JsonPropertyName("lat")]
    public double Lat { get; set; }
    
    [JsonPropertyName("lng")]
    public double Lng { get; set; }
}
