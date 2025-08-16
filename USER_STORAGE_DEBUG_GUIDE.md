# Azure Storage User Debugging Guide

## 1. **Azure Portal - Visual Inspection**

### Steps to check users in Azure Portal:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your storage account: `hideandseekstorage`
3. Click on "Tables" in the left menu
4. Look for the "Users" table
5. Click on the table to view all user records
6. You should see entries with:
   - PartitionKey: "Users"
   - RowKey: username
   - Username, Email, Points, CreatedDate, etc.

## 2. **Azure Storage Explorer**

### Install Azure Storage Explorer:
1. Download from: https://azure.microsoft.com/en-us/features/storage-explorer/
2. Connect to your storage account using the connection string:
   ```
   DefaultEndpointsProtocol=https;AccountName=hideandseekstorage;AccountKey=FyD83/a/dcUWqyW0xnJde5sQSPCfEVExGtTCxEZTGrw1NxioiDobLTcHySX9kpHprzFDGU9zjzsA+ASt4SmRLg==;EndpointSuffix=core.windows.net
   ```
3. Navigate to Tables → Users table
4. View, edit, or delete user records directly

## 3. **Add Debug Logging to Your Application**

### Add this to your UserService.cs for better debugging:

```csharp
public async Task<User> CreateUserAsync(string username, string email, string password)
{
    try
    {
        _logger.LogInformation("Creating user: {Username}", username);
        
        // Check if user already exists
        var existingUser = await GetUserAsync(username);
        if (existingUser != null)
        {
            _logger.LogWarning("User already exists: {Username}", username);
            throw new InvalidOperationException("Username already exists");
        }

        // Hash the password
        var passwordHash = HashPassword(password);

        var user = new User
        {
            RowKey = username,
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            Points = 0,
            CreatedDate = DateTime.UtcNow,
            LastLoginDate = DateTime.UtcNow,
            DisplayName = username,
            IsActive = true
        };

        _logger.LogInformation("Saving user to Azure Table Storage: {Username}", username);
        await _userTableClient.AddEntityAsync(user);
        
        _logger.LogInformation("User created successfully: {Username}", username);
        return user;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating user: {Username}", username);
        throw;
    }
}
```

## 4. **Create a Debug API Endpoint**

### Add this to your UsersController.cs:

```csharp
[HttpGet("debug/all")]
public async Task<ActionResult<List<User>>> GetAllUsers()
{
    try
    {
        var users = new List<User>();
        var query = _userTableClient.QueryAsync<User>(u => u.PartitionKey == "Users");
        
        await foreach (var user in query)
        {
            users.Add(user);
        }
        
        return Ok(users);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving all users");
        return StatusCode(500, "An error occurred while retrieving users");
    }
}
```

## 5. **Test User Creation with Postman/curl**

### Test user registration:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test user login:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Get all users (debug endpoint):
```bash
curl -X GET http://localhost:5000/api/users/debug/all
```

## 6. **Check Application Logs**

### Enable detailed logging in appsettings.json:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "HideandSeek.Server.Services.UserService": "Debug",
      "HideandSeek.Server.Controllers.UsersController": "Debug"
    }
  }
}
```

## 7. **Common Issues to Check**

### Connection String Issues:
- Verify the connection string in `appsettings.json`
- Check if the storage account exists and is accessible
- Ensure the account key is correct

### Table Creation Issues:
- Azure Table Storage creates tables automatically when you first add data
- If tables don't exist, the first user creation will create them

### Data Structure Issues:
- Ensure your User model implements `ITableEntity` correctly
- Check that PartitionKey and RowKey are set properly
- Verify all required properties are initialized

## 8. **Quick Verification Steps**

1. **Register a test user** through your application
2. **Check the application logs** for any errors
3. **Use the debug endpoint** to list all users
4. **Check Azure Portal** to see if the user appears in the table
5. **Try logging in** with the test user to verify the data is correct

## 9. **Troubleshooting Commands**

### Check if your application is running:
```bash
curl -X GET http://localhost:5000/api/users/debug/all
```

### Check Azure Storage connection:
```bash
# Test with Azure CLI (if installed)
az storage table list --account-name hideandseekstorage --account-key "FyD83/a/dcUWqyW0xnJde5sQSPCfEVExGtTCxEZTGrw1NxioiDobLTcHySX9kpHprzFDGU9zjzsA+ASt4SmRLg=="
```

## 10. **Expected User Data Structure**

When a user is saved correctly, you should see:
- **PartitionKey**: "Users"
- **RowKey**: username
- **Username**: username
- **Email**: email address
- **PasswordHash**: hashed password (SHA256)
- **Points**: 0 (initially)
- **CreatedDate**: UTC timestamp
- **LastLoginDate**: UTC timestamp
- **DisplayName**: username (initially)
- **IsActive**: true
- **Timezone**: empty string (initially) 