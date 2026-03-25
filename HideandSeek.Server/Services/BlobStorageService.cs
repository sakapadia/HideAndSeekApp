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
    private bool _containerEnsured;

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
        try
        {
            await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
            _containerEnsured = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create/verify blob container {ContainerName}", _containerClient.Name);
            throw;
        }
    }

    public async Task<string> UploadMediaAsync(Stream file, string fileName, string contentType)
    {
        await EnsureContainerExistsAsync();

        var blobName = $"{Guid.NewGuid():N}_{fileName}";
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
            var blobName = new BlobUriBuilder(uri).BlobName;
            var blobClient = _containerClient.GetBlobClient(blobName);
            return GenerateSasUrl(blobClient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating SAS URL for {BlobUrl}", blobUrl);
            return blobUrl; // fallback to original
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
            var blobName = new BlobUriBuilder(uri).BlobName;
            var blobClient = _containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync();
            _logger.LogInformation("Deleted blob {BlobName}", blobName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blob {BlobUrl}", blobUrl);
            throw;
        }
    }
}
