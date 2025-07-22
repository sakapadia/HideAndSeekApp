using HideandSeek.Server.Services;

// ===== APPLICATION STARTUP CONFIGURATION =====
// This file configures the ASP.NET Core application, including:
// - Service registration and dependency injection
// - Middleware pipeline configuration
// - CORS policy for frontend communication
// - API documentation with Swagger

var builder = WebApplication.CreateBuilder(args);

// ===== SERVICE REGISTRATION =====

// Add MVC controllers for API endpoints
builder.Services.AddControllers();

// Add API documentation and testing tools
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ===== CORS CONFIGURATION =====
// Configure Cross-Origin Resource Sharing to allow the React frontend
// to communicate with the ASP.NET Core backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // Allow requests from any origin (suitable for development)
        // In production, you should restrict this to specific domains
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ===== DEPENDENCY INJECTION =====
// Register application services for dependency injection
builder.Services.AddScoped<ITableStorageService, TableStorageService>();

// ===== APPLICATION BUILD AND CONFIGURATION =====
var app = builder.Build();

// ===== STATIC FILE SERVING =====
// Serve static files (HTML, CSS, JS) from the wwwroot folder
// This allows the React app to be served by the ASP.NET Core application
app.UseDefaultFiles();
app.UseStaticFiles();

// ===== DEVELOPMENT TOOLS =====
// Configure the HTTP request pipeline for development environment
if (app.Environment.IsDevelopment())
{
    // Enable Swagger UI for API documentation and testing
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ===== MIDDLEWARE PIPELINE =====

// Redirect HTTP requests to HTTPS for security
app.UseHttpsRedirection();

// Apply CORS policy to allow cross-origin requests
app.UseCors("AllowAll");

// Enable authorization (currently not used but available for future features)
app.UseAuthorization();

// ===== ROUTING =====
// Map API controllers to handle HTTP requests
app.MapControllers();

// ===== SPA FALLBACK =====
// For any request that doesn't match an API route, serve the React app
// This enables client-side routing in the React application
app.MapFallbackToFile("/index.html");

// ===== APPLICATION START =====
// Start the web server and begin listening for HTTP requests
app.Run();
