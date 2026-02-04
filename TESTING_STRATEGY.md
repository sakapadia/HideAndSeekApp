# Testing Strategy for Hide and Seek Project

## Overview

This document outlines a comprehensive testing strategy for the Hide and Seek noise reporting application, covering frontend (React), backend (ASP.NET Core), and integration testing.

---

## 1. Frontend Testing (React)

### 1.1 Component Unit Tests

**Framework:** Vitest + React Testing Library

**Priority Components to Test:**

#### High Priority:
1. **`ReportingFlow.jsx`**
   - Screen navigation logic
   - Form state management
   - Validation rules
   - API submission flow
   - Error handling

2. **`OAuthLogin.jsx`**
   - OAuth provider selection
   - Redirect handling
   - Error state display
   - Token validation

3. **`UserProfile.jsx`**
   - Profile data display
   - Update functionality
   - Report listing
   - Delete report functionality

4. **`Screens.jsx`** (Individual screen components)
   - `WhatScreen`: Category selection, description validation
   - `WhereScreen`: Address input validation
   - `WhenScreen`: Date/time selection, recurrence toggle
   - `ReviewScreen`: Data summary display

5. **`UIComponents.jsx`**
   - Reusable components (Button, Input, RadioGroup, etc.)
   - Form validation
   - Accessibility

#### Medium Priority:
- `App.jsx`: Main app state management, mode switching
- Map integration components
- Error handling components

**Example Test Structure:**
```javascript
// ReportingFlow.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportingFlow } from './ReportingFlow';

describe('ReportingFlow', () => {
  it('should navigate to What screen when creating report', () => {
    // Test navigation
  });
  
  it('should validate required fields before proceeding', () => {
    // Test validation
  });
  
  it('should submit report data to API', async () => {
    // Test API integration with mocks
  });
});
```

### 1.2 Utility Function Tests

**Functions to Test:**
- `getEstimatedDurationText()` in `App.jsx`
- Date formatting functions
- Form validation helpers
- Map marker creation logic

### 1.3 Integration Tests

**Test Scenarios:**
- Complete report submission flow
- OAuth login flow (mocked)
- Map marker rendering
- Filter application
- Upvote functionality

**Tools:**
- Vitest for test runner
- MSW (Mock Service Worker) for API mocking
- React Testing Library for component testing

---

## 2. Backend Testing (.NET)

### 2.1 Unit Tests

**Framework:** xUnit + Moq

**Services to Test:**

#### High Priority:

1. **`ReportMergingService`**
   - Report proximity detection
   - Merge logic
   - Comment merging
   - Category matching

2. **`JwtService`**
   - Token generation
   - Token validation
   - Claim extraction
   - Expiration handling

3. **`OAuthService`**
   - Provider URL generation
   - Token validation (mock external APIs)
   - User info extraction

4. **`UserService`**
   - User creation
   - Points awarding
   - Report retrieval by user
   - User deletion

5. **`TableStorageService`**
   - Query by bounds
   - ZIP code extraction
   - Report creation
   - Report updates

6. **`GeographicUtils`**
   - Distance calculations
   - Bounds checking
   - Coordinate validation

**Example Test Structure:**
```csharp
// ReportMergingServiceTests.cs
public class ReportMergingServiceTests
{
    [Fact]
    public async Task ProcessNewReport_ShouldMerge_WhenWithinProximity()
    {
        // Arrange
        var mockStorage = new Mock<ITableStorageService>();
        var service = new ReportMergingService(mockStorage.Object);
        
        // Act
        var result = await service.ProcessNewReportAsync(newReport, "user", "userId");
        
        // Assert
        Assert.NotNull(result);
        // Verify merge logic
    }
}
```

### 2.2 Controller Tests

**Controllers to Test:**

1. **`NoiseReportsController`**
   - GET `/api/noisereports` - Query parameters, bounds validation
   - POST `/api/noisereports` - Validation, authentication
   - POST `/api/noisereports/comprehensive` - Full flow
   - POST `/api/noisereports/{id}/upvote` - Upvote logic
   - POST `/api/noisereports/{id}/comments` - Comment addition

2. **`OAuthController`**
   - OAuth callback handling
   - Token validation
   - Logout functionality

3. **`UsersController`**
   - Profile retrieval
   - Profile updates
   - Report listing

**Tools:**
- xUnit for test framework
- Moq for mocking dependencies
- FluentAssertions for readable assertions
- Microsoft.AspNetCore.Mvc.Testing for integration testing

---

## 3. Integration Tests

### 3.1 API Integration Tests

**Test Scenarios:**

1. **Report Submission Flow**
   - Create report → Verify storage → Retrieve report
   - Test with different report types
   - Test validation errors

2. **OAuth Flow**
   - Mock OAuth provider responses
   - Test callback handling
   - Test JWT token generation

3. **Report Merging**
   - Create multiple reports in proximity
   - Verify merging behavior
   - Test comment aggregation

4. **Geographic Queries**
   - Test bounds-based queries
   - Test ZIP code filtering
   - Test date filtering

**Tools:**
- `WebApplicationFactory<T>` for in-memory server
- Test containers or Azurite for Azure Table Storage testing

### 3.2 Database Integration Tests

**Test Scenarios:**
- Azure Table Storage operations
- Partition key strategies
- Query performance
- Data consistency

**Approach:**
- Use Azurite (local Azure Storage emulator) for testing
- Or use test containers with Azure Storage
- Clean up test data after each test

---

## 4. End-to-End (E2E) Tests

### 4.1 Critical User Flows

**Framework:** Playwright or Cypress

**Test Scenarios:**

1. **Complete Report Submission**
   - Login → Navigate to report → Fill form → Submit → Verify
   - Test all screen transitions
   - Test validation at each step

2. **OAuth Authentication**
   - Click login → Redirect to provider → Return → Verify session
   - Test all providers (Google, Facebook, Microsoft)

3. **Map Interaction**
   - Load map → View reports → Click marker → View details
   - Test filtering
   - Test upvoting from map

4. **User Profile Management**
   - View profile → Update profile → View reports → Delete report

5. **Report Merging (User Perspective)**
   - Submit duplicate report → Verify merge → Check comments

**Tools:**
- **Playwright** (Recommended) - Cross-browser, fast, reliable
- **Cypress** - Good developer experience, but slower

---

## 5. Performance Testing

### 5.1 Frontend Performance

**Test Areas:**
- Map rendering with many markers
- Form validation performance
- Large report lists
- Bundle size analysis

**Tools:**
- Lighthouse CI
- Web Vitals monitoring
- React DevTools Profiler

### 5.2 Backend Performance

**Test Areas:**
- API response times
- Concurrent request handling
- Database query performance
- Geographic query optimization

**Tools:**
- k6 or Artillery for load testing
- Application Insights for monitoring
- BenchmarkDotNet for micro-benchmarks

---

## 6. Security Testing

### 6.1 Authentication & Authorization

**Test Scenarios:**
- JWT token validation
- Unauthorized access attempts
- Token expiration handling
- OAuth token security

### 6.2 Input Validation

**Test Scenarios:**
- SQL injection (even though using Table Storage)
- XSS prevention
- CSRF protection
- Input sanitization

**Tools:**
- OWASP ZAP
- Manual security audits
- Dependency scanning (Snyk, Dependabot)

---

## 7. Visual Regression Testing

**Framework:** Percy, Chromatic, or Playwright Visual Comparisons

**Test Areas:**
- Component rendering
- Responsive design
- Dark mode (if implemented)
- Cross-browser consistency

---

## 8. Accessibility Testing

**Test Areas:**
- Keyboard navigation
- Screen reader compatibility
- ARIA labels
- Color contrast
- Form accessibility

**Tools:**
- axe DevTools
- WAVE
- Lighthouse accessibility audits
- Manual testing with screen readers

---

## 9. Testing Infrastructure Setup

### 9.1 Frontend Testing Setup

```bash
cd hideandseek.client
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @vitest/ui msw
```

**Create `vitest.config.js`:**
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
```

### 9.2 Backend Testing Setup

```bash
dotnet new xunit -n HideandSeek.Server.Tests
dotnet sln add HideandSeek.Server.Tests/HideandSeek.Server.Tests.csproj
cd HideandSeek.Server.Tests
dotnet add reference ../HideandSeek.Server/HideandSeek.Server.csproj
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

### 9.3 E2E Testing Setup

```bash
npm install -D @playwright/test
npx playwright install
```

---

## 10. CI/CD Integration

### 10.1 Update GitHub Actions Workflow

Add test steps to `.github/workflows/main_hideandseekapp.yml`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Frontend tests
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        run: |
          cd hideandseek.client
          npm ci
      
      - name: Run frontend tests
        run: |
          cd hideandseek.client
          npm test -- --run
      
      # Backend tests
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.x'
      
      - name: Run backend tests
        run: |
          dotnet test --no-build --verbosity normal
  
  build:
    needs: test
    # ... existing build steps
```

---

## 11. Testing Priorities

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up testing infrastructure
2. ✅ Unit tests for critical services (JwtService, ReportMergingService)
3. ✅ Component tests for ReportingFlow
4. ✅ API integration tests for report submission

### Phase 2: Core Features (Week 3-4)
1. ✅ OAuth flow testing
2. ✅ Map integration tests
3. ✅ User profile tests
4. ✅ Report querying tests

### Phase 3: E2E & Quality (Week 5-6)
1. ✅ End-to-end user flows
2. ✅ Performance testing
3. ✅ Security testing
4. ✅ Accessibility testing

---

## 12. Test Coverage Goals

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All API endpoints covered
- **E2E Tests:** All critical user flows covered
- **Component Tests:** All reusable components tested

---

## 13. Recommended Tools Summary

| Testing Type | Tool | Purpose |
|-------------|------|---------|
| Frontend Unit | Vitest | Fast test runner |
| Frontend Component | React Testing Library | Component testing |
| API Mocking | MSW | Mock API responses |
| Backend Unit | xUnit | .NET test framework |
| Backend Mocking | Moq | Mock dependencies |
| Integration | WebApplicationFactory | In-memory API testing |
| E2E | Playwright | Browser automation |
| Performance | k6 | Load testing |
| Security | OWASP ZAP | Security scanning |
| Visual | Playwright Visual | Visual regression |
| Accessibility | axe DevTools | A11y testing |

---

## 14. Best Practices

1. **Test Isolation:** Each test should be independent
2. **Arrange-Act-Assert:** Clear test structure
3. **Mock External Dependencies:** Don't call real APIs in unit tests
4. **Test Behavior, Not Implementation:** Focus on what, not how
5. **Keep Tests Fast:** Unit tests should run in milliseconds
6. **Use Descriptive Names:** Test names should explain what they test
7. **Test Edge Cases:** Boundary conditions, null values, errors
8. **Maintain Test Data:** Use factories or builders for test data
9. **Continuous Testing:** Run tests on every commit
10. **Test Documentation:** Document complex test scenarios

---

## 15. Getting Started

### Quick Start Commands

```bash
# Frontend
cd hideandseek.client
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm test

# Backend
dotnet new xunit -n HideandSeek.Server.Tests
dotnet test

# E2E
npm install -D @playwright/test
npx playwright test
```

---

This testing strategy provides a comprehensive approach to ensuring quality and reliability across all layers of your application.
