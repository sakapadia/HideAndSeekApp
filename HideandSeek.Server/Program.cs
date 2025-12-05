using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HideandSeek.Server.Services;
using Azure.Data.Tables;

// ===== APPLICATION STARTUP CONFIGURATION =====
// This file configures the ASP.NET Core application, including:
// - Service registration and dependency injection
// - Middleware pipeline configuration
// - CORS policy for frontend communication
// - JWT authentication configuration
// - API documentation with Swagger

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:SecretKey"] ?? "your-super-secret-key-with-at-least-32-characters";
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

// Register services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITableStorageService, TableStorageService>();
builder.Services.AddScoped<IOAuthService, OAuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ReportMergingService>();

// Add geocoding service with HttpClient factory
// This ensures HttpClient is properly injected and managed
builder.Services.AddHttpClient<IGeocodingService, GoogleMapsGeocodingService>();

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
app.UseCors("AllowAll");
app.UseAuthentication(); // Add this line
app.UseAuthorization();
app.MapControllers();

// Serve static files from the React app
app.UseDefaultFiles();
app.UseStaticFiles();

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
