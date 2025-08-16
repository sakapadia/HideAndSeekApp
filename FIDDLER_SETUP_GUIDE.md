# Fiddler Classic Debugging Guide for Hide and Seek Project

## Overview
Your Hide and Seek project consists of:
- **Frontend**: React app running on Vite (port 50695, auto-started by ASP.NET Core)
- **Backend**: ASP.NET Core API (port 5264)
- **Communication**: ASP.NET Core proxies frontend requests and handles API calls

## 1. Configure Fiddler Classic

### Enable HTTPS Decryption
1. Open Fiddler Classic
2. Go to **Tools** → **Options** → **HTTPS** tab
3. Check **"Capture HTTPS CONNECTs"**
4. Check **"Decrypt HTTPS traffic"**
5. Check **"Ignore server certificate errors"**
6. Click **OK**

### Configure Fiddler to Trust Your Development Certificates
1. In Fiddler, go to **Tools** → **Options** → **HTTPS** tab
2. Click **"Actions"** → **"Export Root Certificate to Desktop"**
3. Double-click the exported certificate file
4. Install it in **"Trusted Root Certification Authorities"**

## 2. Configure Your Application for Fiddler

### Update Vite Configuration
Your current `vite.config.js` already has proxy settings, but you may need to adjust for Fiddler:

```javascript
// In vite.config.js, update the server configuration:
server: {
    proxy: {
        '^/api': {
            target: 'http://localhost:5264', // Use HTTP for Fiddler
            secure: false,
            changeOrigin: true
        },
        '^/weatherforecast': {
            target: 'http://localhost:5264', // Use HTTP for Fiddler
            secure: false,
            changeOrigin: true
        }
    },
    port: 50695,
    https: false // Disable HTTPS for easier debugging
}
```

### Update Backend Configuration
In your `HideandSeek.Server/Properties/launchSettings.json`, ensure HTTP is enabled:

```json
{
  "profiles": {
    "HideandSeek.Server": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "http://localhost:5264;https://localhost:7264",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## 3. Start Debugging Session

### Step 1: Start Fiddler
1. Launch Fiddler Classic
2. Ensure it's capturing traffic (green light in status bar)

### Step 2: Start Your Application (Single Command)
```powershell
cd HideandSeek.Server
dotnet run
```

### Step 3: Access Your Application
Navigate to `http://localhost:5264` in your browser

**Note:** The ASP.NET Core server automatically starts the Vite dev server on port 50695 and proxies frontend requests.

## 4. What You Can Debug with Fiddler

### API Calls to Monitor
Based on your codebase, you'll see these API calls:

1. **Authentication Endpoints**:
   - `POST /api/auth/validate` - JWT token validation
   - `GET /api/auth/google` - OAuth Google login
   - `POST /api/auth/logout` - User logout

2. **User Management**:
   - `GET /api/users/profile` - Get user profile
   - `PUT /api/users/profile` - Update user profile

3. **Noise Reports**:
   - `GET /api/noisereports` - Fetch noise reports
   - `POST /api/noisereports` - Submit new report
   - `PUT /api/noisereports/{id}` - Update report

4. **Weather Data** (if used):
   - `GET /weatherforecast` - Weather information

### Key Debugging Scenarios

#### 1. OAuth Flow Debugging
- Monitor the OAuth redirect flow
- Check token exchange between frontend and backend
- Verify JWT token validation

#### 2. API Response Analysis
- Inspect request/response headers
- Check for CORS issues
- Monitor authentication headers

#### 3. Error Handling
- Capture failed API calls
- Analyze error responses
- Debug network connectivity issues

## 5. Fiddler Filters and Rules

### Create Custom Filters
1. In Fiddler, go to **Rules** → **Customize Rules**
2. Add filters to focus on your application:

```javascript
// Filter for your specific domains
if (oSession.host.Contains("localhost:5264") || 
    oSession.host.Contains("localhost:50696")) {
    oSession["ui-color"] = "orange";
    oSession["ui-bold"] = "true";
}
```

### Useful Fiddler Rules
1. **Highlight API calls**: Color-code different endpoint types
2. **Break on errors**: Set breakpoints on 4xx/5xx responses
3. **Log authentication**: Focus on auth-related requests

## 6. Advanced Debugging Techniques

### Break on Requests
1. In Fiddler, right-click on a request
2. Select **"Break on Response"**
3. Modify request/response data in real-time

### Inspect WebSocket Traffic
If your app uses WebSockets:
1. Enable WebSocket inspection in Fiddler
2. Monitor real-time communication

### Performance Analysis
1. Use Fiddler's **Statistics** tab
2. Analyze response times
3. Identify slow API calls

## 7. Troubleshooting Common Issues

### HTTPS Certificate Issues
- Ensure Fiddler's root certificate is installed
- Trust the certificate in your browser
- Check for certificate pinning in your app

### CORS Problems
- Monitor CORS headers in responses
- Check preflight OPTIONS requests
- Verify allowed origins in your backend

### Authentication Issues
- Inspect JWT tokens in requests
- Check token expiration
- Monitor OAuth redirect flows

## 8. Useful Fiddler Extensions

Consider installing these Fiddler extensions:
- **JSON Viewer**: Better JSON response formatting
- **JWT Decoder**: Decode JWT tokens in requests
- **Request Builder**: Create custom test requests

## 9. Best Practices

1. **Start with a clean session**: Clear Fiddler's cache before debugging
2. **Use filters**: Focus on relevant traffic
3. **Document issues**: Take screenshots of problematic requests
4. **Test systematically**: Debug one feature at a time
5. **Monitor performance**: Watch for slow responses

## 10. Alternative Debugging Tools

If Fiddler doesn't meet your needs:
- **Browser DevTools**: Network tab for basic debugging
- **Postman**: API testing and debugging
- **Charles Proxy**: Alternative to Fiddler
- **Burp Suite**: Advanced web application security testing

## Quick Start Checklist

- [ ] Install and configure Fiddler Classic
- [ ] Enable HTTPS decryption
- [ ] Install Fiddler's root certificate
- [ ] Update your application configuration
- [ ] Start backend server
- [ ] Start frontend development server
- [ ] Begin capturing traffic
- [ ] Test authentication flow
- [ ] Monitor API calls
- [ ] Debug any issues found

This setup will give you comprehensive visibility into all network communication between your React frontend and ASP.NET Core backend, making it much easier to debug authentication issues, API problems, and performance bottlenecks.
