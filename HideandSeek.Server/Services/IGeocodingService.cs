using System.Threading.Tasks;

namespace HideandSeek.Server.Services;

/// <summary>
/// Interface for geocoding services that convert addresses to coordinates.
/// </summary>
public interface IGeocodingService
{
    /// <summary>
    /// Converts an address string to geographic coordinates.
    /// </summary>
    /// <param name="address">The address to geocode</param>
    /// <returns>Coordinates (latitude, longitude) for the address, or null if geocoding fails</returns>
    Task<(double Latitude, double Longitude)?> GeocodeAddressAsync(string address);
    
    /// <summary>
    /// Converts coordinates to an address (reverse geocoding).
    /// </summary>
    /// <param name="latitude">Latitude coordinate</param>
    /// <param name="longitude">Longitude coordinate</param>
    /// <returns>Formatted address string, or null if reverse geocoding fails</returns>
    Task<string?> ReverseGeocodeAsync(double latitude, double longitude);
}
