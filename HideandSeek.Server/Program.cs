using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HideandSeek.Server.Services;
using Azure.Data.Tables;
using Azure.Storage.Blobs;

// ===== APPLICATION STARTUP CONFIGURATION =====
// This file configures the ASP.NET Core application, including:
// - Service registration and dependency injection
// - Middleware pipeline configuration
// - CORS policy for frontend communication
// - JWT authentication configuration
// - API documentation with Swagger

var builder = WebApplication.CreateBuilder(args);

// Load optional local secrets file (gitignored)
builder.Configuration.AddJsonFile("appsettings.private.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS - restrict to known frontend origins
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "https://hideandseekapp.azurewebsites.net" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey must be configured. Set it via environment variables, user-secrets, or Azure App Settings.");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "HideandSeek";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "HideandSeekUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// Add Authorization
builder.Services.AddAuthorization();

// Add HttpClient for OAuth services
builder.Services.AddHttpClient();

// Register token encryption service
builder.Services.AddSingleton<ITokenEncryptionService, TokenEncryptionService>();

// Register services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITableStorageService, TableStorageService>();
builder.Services.AddHttpClient<IOAuthService, OAuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ReportMergingService>();

// Add geocoding service with HttpClient factory
// This ensures HttpClient is properly injected and managed
builder.Services.AddHttpClient<IGeocodingService, GoogleMapsGeocodingService>();

// Register Azure Blob Storage services for media upload
// Use AzureStorage:ConnectionString, falling back to the shared ConnectionStrings:AzureTableStorage
var blobConnectionString = builder.Configuration["AzureStorage:ConnectionString"];
if (string.IsNullOrEmpty(blobConnectionString))
{
    blobConnectionString = builder.Configuration.GetConnectionString("AzureTableStorage");
}
if (!string.IsNullOrEmpty(blobConnectionString))
{
    builder.Services.AddSingleton(new BlobServiceClient(blobConnectionString));
    builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
}

var app = builder.Build();

// Initialize Azure Tables
await InitializeAzureTables(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Serve static files from the React app (before auth so static assets don't require auth)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Fallback to index.html for SPA routing
app.MapFallbackToFile("/index.html");

app.Run();

// Initialize Azure Tables
static async Task InitializeAzureTables(IServiceProvider serviceProvider)
{
    try
    {
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();
        var connectionString = configuration.GetConnectionString("AzureTableStorage");
        
        if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("YOUR_AZURE_STORAGE_CONNECTION_STRING_HERE"))
        {
            Console.WriteLine("⚠️  Azure Storage connection string not configured. Using development storage.");
            return;
        }

        var tableServiceClient = new TableServiceClient(connectionString);
        
        // Create Users table
        var usersTable = tableServiceClient.GetTableClient("Users");
        await usersTable.CreateIfNotExistsAsync();
        Console.WriteLine("✅ Users table initialized");
        
        // Create NoiseReports table
        var reportsTable = tableServiceClient.GetTableClient("NoiseReports");
        await reportsTable.CreateIfNotExistsAsync();
        Console.WriteLine("✅ NoiseReports table initialized");
        
        Console.WriteLine("✅ Azure Tables initialized successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error initializing Azure Tables: {ex.Message}");
    }
}
