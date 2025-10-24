using System;

namespace HideandSeek.Server.Services;

/// <summary>
/// Utility class for geographic calculations, particularly for determining
/// if reports should be merged based on blast radius and proximity.
/// </summary>
public static class GeographicUtils
{
    /// <summary>
    /// Earth's radius in kilometers for distance calculations.
    /// </summary>
    private const double EarthRadiusKm = 6371.0;

    /// <summary>
    /// Calculates the distance between two geographic points using the Haversine formula.
    /// </summary>
    /// <param name="lat1">Latitude of the first point</param>
    /// <param name="lon1">Longitude of the first point</param>
    /// <param name="lat2">Latitude of the second point</param>
    /// <param name="lon2">Longitude of the second point</param>
    /// <returns>Distance in kilometers</returns>
    public static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        
        return EarthRadiusKm * c;
    }

    /// <summary>
    /// Converts degrees to radians.
    /// </summary>
    private static double ToRadians(double degrees)
    {
        return degrees * (Math.PI / 180);
    }

    /// <summary>
    /// Gets the blast radius distance in kilometers based on the blast radius string.
    /// </summary>
    /// <param name="blastRadius">The blast radius string ("Small", "Medium", "Large")</param>
    /// <returns>Distance in kilometers</returns>
    public static double GetBlastRadiusDistance(string blastRadius)
    {
        return blastRadius.ToLower() switch
        {
            "small" => 0.1,  // 100 meters
            "medium" => 0.5, // 500 meters
            "large" => 1.0,  // 1 kilometer
            _ => 0.1         // Default to small radius
        };
    }

    /// <summary>
    /// Determines if two reports should be merged based on their proximity and blast radius.
    /// </summary>
    /// <param name="report1">The first report</param>
    /// <param name="report2">The second report</param>
    /// <returns>True if the reports should be merged</returns>
    public static bool ShouldMergeReports(Models.NoiseReport report1, Models.NoiseReport report2)
    {
        // Check if reports have the same category
        if (report1.NoiseType != report2.NoiseType)
            return false;

        // Calculate distance between reports
        var distance = CalculateDistance(
            report1.Latitude, report1.Longitude,
            report2.Latitude, report2.Longitude
        );

        // Get the maximum blast radius between the two reports
        var maxBlastRadius = Math.Max(
            GetBlastRadiusDistance(report1.BlastRadius),
            GetBlastRadiusDistance(report2.BlastRadius)
        );

        // Reports should be merged if they're within each other's blast radius
        return distance <= maxBlastRadius;
    }

    /// <summary>
    /// Finds all reports within a specified distance of a given point.
    /// </summary>
    /// <param name="reports">List of reports to search</param>
    /// <param name="latitude">Center latitude</param>
    /// <param name="longitude">Center longitude</param>
    /// <param name="maxDistanceKm">Maximum distance in kilometers</param>
    /// <returns>List of reports within the specified distance</returns>
    public static List<Models.NoiseReport> FindReportsWithinDistance(
        List<Models.NoiseReport> reports,
        double latitude,
        double longitude,
        double maxDistanceKm)
    {
        return reports.Where(report =>
        {
            var distance = CalculateDistance(
                latitude, longitude,
                report.Latitude, report.Longitude
            );
            return distance <= maxDistanceKm;
        }).ToList();
    }

    /// <summary>
    /// Finds reports that could potentially be merged with a new report.
    /// </summary>
    /// <param name="existingReports">List of existing reports</param>
    /// <param name="newReport">The new report to check for merging</param>
    /// <returns>List of reports that could be merged with the new report</returns>
    public static List<Models.NoiseReport> FindMergeableReports(
        List<Models.NoiseReport> existingReports,
        Models.NoiseReport newReport)
    {
        return existingReports
            .Where(report => !report.IsMerged && ShouldMergeReports(report, newReport))
            .OrderBy(report => CalculateDistance(
                newReport.Latitude, newReport.Longitude,
                report.Latitude, report.Longitude
            ))
            .ToList();
    }
}
