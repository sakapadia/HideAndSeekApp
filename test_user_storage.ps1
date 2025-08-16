# Test User Storage Script
# This script helps verify that users are being saved correctly to Azure Storage

param(
    [string]$BaseUrl = "http://localhost:5264",
    [string]$TestUsername = "testuser",
    [string]$TestEmail = "test@example.com",
    [string]$TestPassword = "password123"
)

Write-Host "=== Azure Storage User Testing Script ===" -ForegroundColor Green
Write-Host ""

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        
        return $response
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Check if server is running
Write-Host "1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/users/debug/all" -Method GET -TimeoutSec 5
    Write-Host "✓ Server is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Server is not running. Please start your application first." -ForegroundColor Red
    Write-Host "Run: dotnet run --project HideandSeek.Server" -ForegroundColor Cyan
    exit 1
}

# Test 2: Get all existing users
Write-Host "`n2. Checking existing users..." -ForegroundColor Yellow
$existingUsers = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/api/users/debug/all"
if ($existingUsers) {
    Write-Host "✓ Found $($existingUsers.Count) existing users" -ForegroundColor Green
    foreach ($user in $existingUsers) {
        Write-Host "  - $($user.Username) (Points: $($user.Points), Created: $($user.CreatedDate))" -ForegroundColor Gray
    }
}
else {
    Write-Host "✓ No existing users found" -ForegroundColor Green
}

# Test 3: Register a new test user
Write-Host "`n3. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    username = $TestUsername
    email = $TestEmail
    password = $TestPassword
} | ConvertTo-Json

$registerResponse = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/api/users/register" -Body $registerBody

if ($registerResponse) {
    Write-Host "✓ Test user registered successfully" -ForegroundColor Green
    Write-Host "  Username: $($registerResponse.Username)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.Email)" -ForegroundColor Gray
    Write-Host "  Points: $($registerResponse.Points)" -ForegroundColor Gray
}
else {
    Write-Host "✗ Failed to register test user" -ForegroundColor Red
}

# Test 4: Login with test user
Write-Host "`n4. Testing login..." -ForegroundColor Yellow
$loginBody = @{
    username = $TestUsername
    password = $TestPassword
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Method "POST" -Url "$BaseUrl/api/users/login" -Body $loginBody

if ($loginResponse) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Last Login: $($loginResponse.LastLoginDate)" -ForegroundColor Gray
}
else {
    Write-Host "✗ Login failed" -ForegroundColor Red
}

# Test 5: Verify user appears in all users list
Write-Host "`n5. Verifying user storage..." -ForegroundColor Yellow
$allUsers = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/api/users/debug/all"
$testUser = $allUsers | Where-Object { $_.Username -eq $TestUsername }

if ($testUser) {
    Write-Host "✓ Test user found in storage" -ForegroundColor Green
    Write-Host "  Username: $($testUser.Username)" -ForegroundColor Gray
    Write-Host "  Email: $($testUser.Email)" -ForegroundColor Gray
    Write-Host "  Points: $($testUser.Points)" -ForegroundColor Gray
    Write-Host "  IsActive: $($testUser.IsActive)" -ForegroundColor Gray
}
else {
    Write-Host "✗ Test user not found in storage" -ForegroundColor Red
}

# Test 6: Get user profile
Write-Host "`n6. Testing profile retrieval..." -ForegroundColor Yellow
$profileResponse = Invoke-ApiRequest -Method "GET" -Url "$BaseUrl/api/users/$TestUsername/profile"

if ($profileResponse) {
    Write-Host "✓ User profile retrieved successfully" -ForegroundColor Green
    Write-Host "  Display Name: $($profileResponse.DisplayName)" -ForegroundColor Gray
    Write-Host "  Created Date: $($profileResponse.CreatedDate)" -ForegroundColor Gray
}
else {
    Write-Host "✗ Failed to retrieve user profile" -ForegroundColor Red
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "If all tests passed with ✓, your user storage is working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Azure Portal to see the 'Users' table" -ForegroundColor Cyan
Write-Host "2. Use Azure Storage Explorer for detailed inspection" -ForegroundColor Cyan
Write-Host "3. Monitor application logs for any errors" -ForegroundColor Cyan
Write-Host ""
Write-Host "To clean up test data, you can delete the test user manually." -ForegroundColor Yellow 