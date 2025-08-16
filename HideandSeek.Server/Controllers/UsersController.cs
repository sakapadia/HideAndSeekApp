using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Models;
using HideandSeek.Server.Services;

namespace HideandSeek.Server.Controllers;

/// <summary>
/// API controller for managing user accounts and profiles.
/// Provides RESTful endpoints for profile management and user data.
/// 
/// Base Route: /api/users
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    /// <summary>
    /// Initializes the controller with dependency injection.
    /// </summary>
    /// <param name="userService">Service for user account operations</param>
    /// <param name="logger">Logger for error tracking and debugging</param>
    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/users/{userId}/profile
    /// 
    /// Retrieves a user's profile information.
    /// Used by the frontend to display user profile data.
    /// </summary>
    /// <param name="userId">User ID of the user whose profile to retrieve</param>
    /// <returns>User profile information</returns>
    [HttpGet("{userId}/profile")]
    public async Task<ActionResult<User>> GetProfile(string userId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Return user without sensitive information
            return Ok(new
            {
                user.RowKey,
                user.DisplayName,
                user.Email,
                user.Points,
                user.CreatedDate,
                user.LastLoginDate,
                user.ProfilePictureUrl,
                user.Timezone,
                user.OAuthProvider
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profile for user: {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving the profile");
        }
    }

    /// <summary>
    /// GET /api/users/{userId}/reports
    /// 
    /// Retrieves all reports submitted by a specific user.
    /// Used by the frontend to display user's report history.
    /// </summary>
    /// <param name="userId">User ID of the user whose reports to retrieve</param>
    /// <returns>List of reports submitted by the user</returns>
    [HttpGet("{userId}/reports")]
    public async Task<ActionResult<List<NoiseReport>>> GetUserReports(string userId)
    {
        try
        {
            var reports = await _userService.GetUserReportsAsync(userId);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reports for user: {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving user reports");
        }
    }

    /// <summary>
    /// DELETE /api/users/{userId}/reports/{reportId}
    /// 
    /// Deletes a specific report submitted by a user.
    /// Used by the frontend to allow users to delete their own reports.
    /// </summary>
    /// <param name="userId">User ID of the user</param>
    /// <param name="reportId">ID of the report to delete</param>
    /// <returns>Success status</returns>
    [HttpDelete("{userId}/reports/{reportId}")]
    public async Task<ActionResult> DeleteUserReport(string userId, string reportId)
    {
        try
        {
            var success = await _userService.DeleteUserReportAsync(userId, reportId);
            if (!success)
            {
                return BadRequest("Unable to delete report. It may not belong to you or may not exist.");
            }

            return Ok(new { message = "Report deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting report for user: {UserId}, Report: {ReportId}", 
                userId, reportId);
            return StatusCode(500, "An error occurred while deleting the report");
        }
    }

    /// <summary>
    /// PUT /api/users/{userId}/profile
    /// 
    /// Updates a user's profile information.
    /// Used by the frontend to allow users to update their profile.
    /// </summary>
    /// <param name="userId">User ID of the user to update</param>
    /// <param name="request">Updated profile information</param>
    /// <returns>Updated user profile</returns>
    [HttpPut("{userId}/profile")]
    public async Task<ActionResult<User>> UpdateProfile(string userId, [FromBody] UpdateProfileRequest request)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Update allowed fields
            if (!string.IsNullOrEmpty(request.DisplayName))
            {
                user.DisplayName = request.DisplayName;
            }

            if (!string.IsNullOrEmpty(request.ProfilePictureUrl))
            {
                user.ProfilePictureUrl = request.ProfilePictureUrl;
            }

            if (!string.IsNullOrEmpty(request.Timezone))
            {
                user.Timezone = request.Timezone;
            }

            if (!string.IsNullOrEmpty(request.CustomUsername))
            {
                user.CustomUsername = request.CustomUsername;
            }

            await _userService.UpdateOAuthUserAsync(user);

            // Return updated user without sensitive information
            return Ok(new
            {
                user.RowKey,
                user.DisplayName,
                user.Email,
                user.Points,
                user.CreatedDate,
                user.LastLoginDate,
                user.ProfilePictureUrl,
                user.Timezone,
                user.OAuthProvider,
                user.CustomUsername
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user: {UserId}", userId);
            return StatusCode(500, "An error occurred while updating the profile");
        }
    }

    /// <summary>
    /// GET /api/users/debug/all
    /// 
    /// DEBUG ENDPOINT: Retrieves all users from Azure Table Storage.
    /// Used for debugging and verifying user storage.
    /// </summary>
    /// <returns>List of all users (without sensitive information)</returns>
    [HttpGet("debug/all")]
    public async Task<ActionResult<List<object>>> GetAllUsers()
    {
        try
        {
            var allUsers = await _userService.GetAllUsersAsync();
            var users = new List<object>();
            
            foreach (var user in allUsers)
            {
                users.Add(new
                {
                    user.RowKey,
                    user.DisplayName,
                    user.Email,
                    user.Points,
                    user.CreatedDate,
                    user.LastLoginDate,
                    user.ProfilePictureUrl,
                    user.IsActive,
                    user.Timezone,
                    user.OAuthProvider
                });
            }
            
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users");
            return StatusCode(500, "An error occurred while retrieving users");
        }
    }
}

/// <summary>
/// Request model for profile updates.
/// </summary>
public class UpdateProfileRequest
{
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? Timezone { get; set; }
    public string? CustomUsername { get; set; }
} 