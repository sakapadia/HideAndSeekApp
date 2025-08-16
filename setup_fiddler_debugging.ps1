# Hide and Seek - Fiddler Debugging Setup Script
# This script helps set up your development environment for Fiddler debugging

Write-Host "🔧 Setting up Fiddler debugging environment for Hide and Seek project..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "hideandseek.client") -or -not (Test-Path "HideandSeek.Server")) {
    Write-Host "❌ Error: Please run this script from the root directory of your Hide and Seek project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found project structure" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if .NET is installed
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET found: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET not found. Please install .NET SDK first." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "hideandseek.client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Restore backend dependencies
Write-Host "📦 Restoring backend dependencies..." -ForegroundColor Yellow
Set-Location "../HideandSeek.Server"
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restore backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies restored" -ForegroundColor Green

# Go back to root
Set-Location ".."

Write-Host ""
Write-Host "🎉 Setup complete! Here's how to start debugging:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Open Fiddler Classic and configure HTTPS decryption" -ForegroundColor Cyan
Write-Host "2. Start your backend server:" -ForegroundColor Cyan
Write-Host "   cd HideandSeek.Server" -ForegroundColor White
Write-Host "   dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "3. Start your application (single command):" -ForegroundColor Cyan
Write-Host "   cd HideandSeek.Server" -ForegroundColor White
Write-Host "   dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "4. Open your browser to: http://localhost:5264" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Monitor traffic in Fiddler Classic" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 See FIDDLER_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Yellow
