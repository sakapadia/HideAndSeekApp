# Unused Files Report

This report identifies files in the HideandSeek project that are not actively used by the application at runtime.

## Summary

Files are categorized as:
- **Unused Runtime Code**: Not referenced by the application
- **Development/Debug Tools**: Used for development/testing but not part of the app
- **Build Output**: Generated files from build process
- **Documentation**: Documentation files (not code)

---

## Unused Runtime Code

### Server-Side (.NET)

1. **`HideandSeek.Server/WeatherForecast.cs`**
   - Template file from ASP.NET project template
   - Not referenced by any controllers or services
   - Only used by WeatherForecastController (which is also unused)
   - **Recommendation**: Can be deleted if not needed for testing

2. **`HideandSeek.Server/Controllers/WeatherForecastController.cs`**
   - Template controller from ASP.NET project template
   - Provides `/weatherforecast` endpoint but not used by frontend
   - Only referenced in `HideandSeek.Server.http` (testing file)
   - **Recommendation**: Can be deleted if not needed for testing

### Client-Side (React)

3. **`hideandseek.client/src/assets/react.svg`**
   - React logo SVG file
   - Not imported or referenced anywhere in the codebase
   - **Recommendation**: Can be deleted

---

## Development/Debug Tools

These files are used for development and debugging but are not part of the application runtime:

4. **`HideandSeek.Server/HideandSeek.Server.http`**
   - REST Client file for testing API endpoints
   - Used for manual API testing
   - **Recommendation**: Keep for development, but not needed in production

5. **`FIDDLER_SETUP_GUIDE.md`**
   - Documentation for setting up Fiddler debugging
   - **Recommendation**: Keep for development reference

6. **`hideandseek_fiddler_rules.js`**
   - FiddlerScript rules for debugging
   - **Recommendation**: Keep for development reference

7. **`setup_fiddler_debugging.ps1`**
   - PowerShell script to set up Fiddler debugging
   - **Recommendation**: Keep for development reference

8. **`test_fiddler_debug.html`**
   - Test page for verifying Fiddler configuration
   - **Recommendation**: Keep for development reference

9. **`test_user_storage.ps1`**
   - PowerShell script to test Azure Storage user persistence
   - **Recommendation**: Keep for development/testing reference

---

## Build Output

10. **`HideandSeek.Server/publish/`** (entire directory)
    - Contains build output from publishing the application
    - Generated files: `*.deps.json`, `*.runtimeconfig.json`, `web.config`, `wwwroot/`
    - **Recommendation**: Should be in `.gitignore`, can be deleted (will be regenerated on build)

---

## Documentation Files

These are documentation files, not code. They're useful for reference but not part of the application:

11. **`DEVELOPMENT_REPORT.md`**
12. **`PROJECT_STRUCTURE.md`**
13. **`README.md`**
14. **`USER_STORAGE_DEBUG_GUIDE.md`**
15. **`hideandseek.client/README.md`**
16. **`hideandseek.client/CHANGELOG.md`**
17. **`HideandSeek.Server/CHANGELOG.md`**

**Recommendation**: Keep for project documentation, but they're not "code" files.

---

## Files That ARE Used (For Reference)

The following files were checked and confirmed to be actively used:

- ✅ `Screens.jsx` - Used by `ReportingFlow.jsx`
- ✅ `logo.png` - Used in `Screens.jsx` components
- ✅ `vite.svg` - Used as favicon in `index.html`
- ✅ All controllers, models, and services are actively used
- ✅ All React components are actively used

---

## Recommendations

### Safe to Delete (if not needed):
1. `HideandSeek.Server/WeatherForecast.cs`
2. `HideandSeek.Server/Controllers/WeatherForecastController.cs`
3. `hideandseek.client/src/assets/react.svg`
4. `HideandSeek.Server/publish/` directory (should be in `.gitignore`)

### Keep for Development:
- All Fiddler-related files (debugging tools)
- `HideandSeek.Server.http` (API testing)
- `test_user_storage.ps1` (testing script)
- All documentation files

### Action Items:
1. ⚠️ **Add `publish/` directory to `.gitignore`** - Currently not ignored, should be excluded from version control
2. Consider removing WeatherForecast files if they're not needed for testing
3. Remove `react.svg` if not planning to use it

---

## Notes

- This analysis was performed by tracing imports, references, and usage patterns
- Some files may be used indirectly or in ways not easily detected by static analysis
- Always test thoroughly after removing files
- Build output directories should typically be excluded from version control

