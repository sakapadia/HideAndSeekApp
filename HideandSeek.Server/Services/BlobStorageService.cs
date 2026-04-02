using System.Text.RegularExpressions;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace HideandSeek.Server.Services;

public interface IBlobStorageService
{
    Task<string> UploadMediaAsync(Stream file, string fileName, string contentType);
    Task DeleteMediaAsync(string blobUrl);
    string GetSasUrl(string blobUrl);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly BlobServiceClient _blobServiceClient;
    private readonly ILogger<BlobStorageService> _logger;
    private volatile bool _containerEnsured;
    private readonly SemaphoreSlim _containerLock = new(1, 1);

    public BlobStorageService(BlobServiceClient blobServiceClient, IConfiguration configuration, ILogger<BlobStorageService> logger)
    {
        _blobServiceClient = blobServiceClient;
        var containerName = configuration["AzureStorage:BlobContainerName"] ?? "report-media";
        _containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        _logger = logger;
    }

    private async Task EnsureContainerExistsAsync()
    {
        if (_containerEnsured) return;
        await _containerLock.WaitAsync();
        try
        {
            if (_containerEnsured) return; // Double-check after acquiring lock
            await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
            _containerEnsured = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create/verify blob container {ContainerName}", _containerClient.Name);
            throw;
        }
        finally
        {
            _containerLock.Release();
        }
    }

    public async Task<string> UploadMediaAsync(Stream file, string fileName, string contentType)
    {
        await EnsureContainerExistsAsync();

        // Sanitize filename: keep only alphanumeric, dots, hyphens, underscores
        var safeName = Regex.Replace(Path.GetFileName(fileName), @"[^a-zA-Z0-9._-]", "_");
        if (safeName.Length > 100) safeName = safeName[..100];
        var blobName = $"{Guid.NewGuid():N}_{safeName}";
        var blobClient = _containerClient.GetBlobClient(blobName);

        var headers = new BlobHttpHeaders { ContentType = contentType };
        await blobClient.UploadAsync(file, new BlobUploadOptions { HttpHeaders = headers });

        _logger.LogInformation("Uploaded blob {BlobName} ({ContentType})", blobName, contentType);

        // Return a SAS URL since the container is private
        return GenerateSasUrl(blobClient);
    }

    public string GetSasUrl(string blobUrl)
    {
        try
        {
            var uri = new Uri(blobUrl);
            var builder = new BlobUriBuilder(uri);

            // Validate the URL points to our storage account and container
            if (!uri.Host.Equals(_containerClient.Uri.Host, StringComparison.OrdinalIgnoreCase) ||
                !builder.BlobContainerName.Equals(_containerClient.Name, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Blob URL does not belong to the expected storage container.");
            }

            var blobClient = _containerClient.GetBlobClient(builder.BlobName);
            return GenerateSasUrl(blobClient);
        }
        catch (ArgumentException)
        {
            throw; // validation failures should propagate
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating SAS URL for blob");
            throw new InvalidOperationException("Unable to generate secure media URL.", ex);
        }
    }

    private string GenerateSasUrl(BlobClient blobClient)
    {
        if (!blobClient.CanGenerateSasUri)
        {
            // Use user delegation key if account key is not available
            _logger.LogWarning("BlobClient cannot generate SAS URI directly, returning plain URL");
            return blobClient.Uri.ToString();
        }

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerClient.Name,
            BlobName = blobClient.Name,
            Resource = "b", // blob
            ExpiresOn = DateTimeOffset.UtcNow.AddHours(24)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        return blobClient.GenerateSasUri(sasBuilder).ToString();
    }

    public async Task DeleteMediaAsync(string blobUrl)
    {
        await EnsureContainerExistsAsync();

        try
        {
            var uri = new Uri(blobUrl);
            var builder = new BlobUriBuilder(uri);

            // Validate the URL points to our storage account and container
            if (!uri.Host.Equals(_containerClient.Uri.Host, StringComparison.OrdinalIgnoreCase) ||
                !builder.BlobContainerName.Equals(_containerClient.Name, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Blob URL does not belong to the expected storage container.");
            }

            var blobClient = _containerClient.GetBlobClient(builder.BlobName);
            await blobClient.DeleteIfExistsAsync();
            _logger.LogInformation("Deleted blob {BlobName}", builder.BlobName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blob");
            throw;
        }
    }
}
