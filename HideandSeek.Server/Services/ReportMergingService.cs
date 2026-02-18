using HideandSeek.Server.Models;
using HideandSeek.Server.Services;

namespace HideandSeek.Server.Services;

/// <summary>
/// Service for handling noise report merging logic based on geographic proximity and category matching.
/// </summary>
public class ReportMergingService
{
    private readonly ITableStorageService _tableStorageService;

    public ReportMergingService(ITableStorageService tableStorageService)
    {
        _tableStorageService = tableStorageService;
    }

    /// <summary>
    /// Processes a new noise report and handles merging with existing reports if applicable.
    /// </summary>
    /// <param name="newReport">The new report to process</param>
    /// <param name="username">Username of the person creating the report</param>
    /// <param name="userId">User ID of the person creating the report</param>
    /// <returns>The final report (either the new report or an existing report it was merged into)</returns>
    public async Task<NoiseReport> ProcessNewReportAsync(NoiseReport newReport, string username, string userId)
    {
        // Initialize comments from the description
        newReport.InitializeCommentsFromDescription(username, userId);

        // Find potential reports to merge with
        var mergeableReports = await FindMergeableReportsAsync(newReport);

        if (mergeableReports.Any())
        {
            // Merge with the closest report
            var targetReport = mergeableReports.First();
            await MergeReportsAsync(targetReport, newReport, username, userId);
            return targetReport;
        }
        else
        {
            // No mergeable reports found, save as new report
            await _tableStorageService.CreateNoiseReportAsync(newReport);
            return newReport;
        }
    }

    /// <summary>
    /// Finds existing reports that could be merged with the new report.
    /// </summary>
    private async Task<List<NoiseReport>> FindMergeableReportsAsync(NoiseReport newReport)
    {
        // Get all reports in the same ZIP code (same partition)
        var reportsInArea = await _tableStorageService.GetNoiseReportsByZipCodeAsync(newReport.ZipCode);

        // Filter out already merged reports and find mergeable ones
        var activeReports = reportsInArea.Where(r => !r.IsMerged).ToList();
        
        return GeographicUtils.FindMergeableReports(activeReports, newReport);
    }

    /// <summary>
    /// Merges a new report into an existing report.
    /// </summary>
    private async Task MergeReportsAsync(NoiseReport targetReport, NoiseReport newReport, string username, string userId)
    {
        // Perform the merge
        targetReport.MergeReport(newReport, username, userId);

        // Update the target report in storage
        await _tableStorageService.UpdateNoiseReportAsync(targetReport);

        // Mark the new report as merged and save it
        await _tableStorageService.CreateNoiseReportAsync(newReport);
    }

    /// <summary>
    /// Adds a comment to an existing report.
    /// </summary>
    /// <param name="reportId">ID of the report to add a comment to</param>
    /// <param name="commentText">Text of the comment</param>
    /// <param name="username">Username of the commenter</param>
    /// <param name="userId">User ID of the commenter</param>
    /// <returns>True if the comment was added successfully</returns>
    public async Task<bool> AddCommentToReportAsync(string reportId, string commentText, string username, string userId)
    {
        try
        {
            var report = await _tableStorageService.GetNoiseReportByIdAsync(reportId);
            if (report == null)
                return false;

            report.AddComment(commentText, username, userId);

            // Keep only the 5 most recent comments
            var comments = report.GetCommentsList();
            if (comments.Count > 5)
            {
                comments = comments.OrderByDescending(c => c.CreatedAt).Take(5).OrderBy(c => c.CreatedAt).ToList();
                report.SetCommentsList(comments);
            }

            await _tableStorageService.UpdateNoiseReportAsync(report);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Gets all comments for a specific report.
    /// </summary>
    /// <param name="reportId">ID of the report</param>
    /// <returns>List of comments for the report</returns>
    public async Task<List<Comment>> GetReportCommentsAsync(string reportId)
    {
        try
        {
            var report = await _tableStorageService.GetNoiseReportByIdAsync(reportId);
            return report?.GetCommentsList() ?? new List<Comment>();
        }
        catch
        {
            return new List<Comment>();
        }
    }

    /// <summary>
    /// Gets a report with its comments for display purposes.
    /// </summary>
    /// <param name="reportId">ID of the report</param>
    /// <returns>The report with comments, or null if not found</returns>
    public async Task<NoiseReport?> GetReportWithCommentsAsync(string reportId)
    {
        try
        {
            return await _tableStorageService.GetNoiseReportByIdAsync(reportId);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Checks if a report should be displayed (not merged into another report).
    /// </summary>
    /// <param name="report">The report to check</param>
    /// <returns>True if the report should be displayed</returns>
    public static bool ShouldDisplayReport(NoiseReport report)
    {
        return !report.IsMerged;
    }

    /// <summary>
    /// Gets the display text for a report (most recent comment or description).
    /// </summary>
    /// <param name="report">The report</param>
    /// <returns>Display text for the report</returns>
    public static string GetReportDisplayText(NoiseReport report)
    {
        return report.GetDisplayText();
    }
}
