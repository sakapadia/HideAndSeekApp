using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HideandSeek.Server.Services;

namespace HideandSeek.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IBlobStorageService _blobStorageService;
    private readonly ILogger<MediaController> _logger;

    private static readonly HashSet<string> AllowedContentTypes = new()
    {
        "image/jpeg", "image/png", "image/webp", "video/mp4"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public MediaController(IBlobStorageService blobStorageService, ILogger<MediaController> logger)
    {
        _blobStorageService = blobStorageService;
        _logger = logger;
    }

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(11 * 1024 * 1024)] // slightly above MaxFileSize to allow for multipart overhead
    public async Task<ActionResult> Upload(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided" });

            if (file.Length > MaxFileSize)
                return BadRequest(new { message = "File exceeds 10 MB limit" });

            if (!AllowedContentTypes.Contains(file.ContentType))
                return BadRequest(new { message = $"File type '{file.ContentType}' is not allowed. Allowed types: JPEG, PNG, WebP, MP4" });

            // Validate magic bytes to ensure content matches declared type
            using var validationStream = file.OpenReadStream();
            if (!IsValidMagicBytes(validationStream, file.ContentType))
                return BadRequest(new { message = "File content does not match its declared type." });

            _logger.LogInformation("Uploading file: {FileName}, Size: {Size}, Type: {ContentType}",
                file.FileName, file.Length, file.ContentType);

            using var uploadStream = file.OpenReadStream();
            var url = await _blobStorageService.UploadMediaAsync(uploadStream, file.FileName, file.ContentType);

            _logger.LogInformation("Upload successful: {Url}", url);
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading media file: {FileName}", file?.FileName);
            return StatusCode(500, new { message = "Upload failed. Please try again." });
        }
    }

    [HttpGet("sas-url")]
    [Authorize]
    public ActionResult GetSasUrl([FromQuery] string blobUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(blobUrl))
                return BadRequest(new { message = "blobUrl is required" });

            var sasUrl = _blobStorageService.GetSasUrl(blobUrl);
            return Ok(new { url = sasUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating SAS URL");
            return StatusCode(500, new { message = "Failed to generate SAS URL. Please try again." });
        }
    }

    [HttpDelete("{*encodedUrl}")]
    [Authorize]
    public async Task<ActionResult> Delete(string encodedUrl)
    {
        try
        {
            var url = Uri.UnescapeDataString(encodedUrl);
            await _blobStorageService.DeleteMediaAsync(url);
            return Ok(new { message = "File deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting media file");
            return StatusCode(500, new { message = "Delete failed. Please try again." });
        }
    }

    private static bool IsValidMagicBytes(Stream stream, string contentType)
    {
        var header = new byte[12];
        var bytesRead = stream.Read(header, 0, header.Length);
        if (bytesRead < 3) return false;

        return contentType switch
        {
            "image/jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            "image/png" => bytesRead >= 4 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,
            "image/webp" => bytesRead >= 12 && header[0] == (byte)'R' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F'
                            && header[8] == (byte)'W' && header[9] == (byte)'E' && header[10] == (byte)'B' && header[11] == (byte)'P',
            "video/mp4" => bytesRead >= 8 && header[4] == (byte)'f' && header[5] == (byte)'t' && header[6] == (byte)'y' && header[7] == (byte)'p',
            _ => false
        };
    }
}
