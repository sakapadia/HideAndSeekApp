### Project overview
- **Stack**: ASP.NET Core backend (`HideandSeek.Server`) + React/Vite frontend (`hideandseek.client`).
- **Purpose**: Collect and manage noise reports, handle OAuth/JWT auth, and provide a React UI for reporting and profile management.
- **Auxiliary**: Fiddler debugging scripts/guides and quick test pages/scripts.

### Top-level
- **`HideandSeek.sln`**: Visual Studio solution tying server and client projects together.
- **`README.md`**: Root project overview and usage notes.
- **`FIDDLER_SETUP_GUIDE.md`**: Steps to configure Fiddler for this project.
- **`hideandseek_fiddler_rules.js`**: FiddlerScript rules to rewrite/inspect project traffic.
- **`setup_fiddler_debugging.ps1`**: PowerShell script to set up Fiddler automatically.
- **`test_fiddler_debug.html`**: Simple page to verify Fiddler rewrite rules.
- **`USER_STORAGE_DEBUG_GUIDE.md`**: Troubleshooting user storage issues.
- **`test_user_storage.ps1`**: PowerShell script to test storage paths/permissions.

---

## Folder structure and rationale

### Root (`/`)
- **Purpose**: Entry point for developers. Holds the solution file, global docs, and ops/dev tooling.
- **Why**: Keeping solution, docs, and scripts at the root makes onboarding and CI/CD wiring straightforward.

### `HideandSeek.Server/` (ASP.NET Core backend)
- **Purpose**: HTTP API for auth, users, and noise reports. Serves the SPA in production-like runs.
- **Why**: Backend separated from UI for clear concerns, scaling, and independent deployment/testing.
- Contains:
  - `Controllers/`: Request handling layer (HTTP endpoints). Rationale: ASP.NET MVC convention; keeps routing and input validation near the edge.
    - `OAuthController.cs`: OAuth entry/callback, token validation, logout, debug.
    - `UsersController.cs`: Profile CRUD, user reports listing/deletion, admin debug list.
    - `NoiseReportsController.cs`: Query by bounds/ZIPs and create report endpoints.
    - `WeatherForecastController.cs`: Template/sample for quick smoke testing.
  - `Services/`: Business logic and infrastructure access. Rationale: DI-friendly, testable, and reusable across controllers.
    - `OAuthService.cs`: Provider URL construction and token/userinfo validation.
    - `JwtService.cs`: JWT issuance/validation centralized from config.
    - `UserService.cs`: User entity persistence, points, and report relations.
    - `TableStorageService.cs`: Noise report data access abstraction over Azure Tables.
  - `Models/`: Data contracts/entities/DTOs. Rationale: Single source of truth for server-side shapes.
    - `User.cs`: Azure Table entity for users; `PartitionKey = Users`, `RowKey = provider_providerId`.
    - `NoiseReport.cs`: Azure Table entity for reports; partitioned by ZIP.
    - `MapBounds.cs`: Bounds, request/response DTOs for report queries.
    - `WeatherForecast.cs`: Template model.
  - `Properties/launchSettings.json`: Local debug profiles. Rationale: Keep runtime profiles out of code.
  - `Program.cs`: Minimal hosting/bootstrap, DI, CORS, Swagger, SPA static hosting. Rationale: Standard minimal-API startup.
  - `appsettings.json`: Central config (storage, OAuth, JWT). Rationale: per-environment config via ASP.NET conventions.
  - `bin/`, `obj/`: Build artifacts (generated). Rationale: Output/intermediate segregation.

### `hideandseek.client/` (React + Vite frontend)
- **Purpose**: SPA that handles OAuth sign-in, reporting flow UI, map mode, and user profile.
- **Why**: Frontend isolated to follow Vite/React conventions, enabling fast dev server and independent tooling.
- Contains:
  - `index.html`: SPA host shell. Rationale: Vite serves and injects the bundle here.
  - `vite.config.js`: Dev proxy to backend, aliases, and dev port. Rationale: Local DX without CORS pain.
  - `eslint.config.js`: Linting rules. Rationale: Shared code quality policy.
  - `package.json` / `package-lock.json`: Dependencies and scripts. Rationale: Node ecosystem standard.
  - `hideandseek.client.esproj`: VS wrapper for JS project. Rationale: Better IDE integration in VS.
  - `public/`: Static files served as-is (e.g., `logo.png`, `vite.svg`). Rationale: Assets not processed by bundler.
  - `src/`: Application source code. Rationale: Vite standard; all compiled assets live here.
    - `main.jsx`: React entry; mounts `<App/>`. Rationale: Single mount point for SPA.
    - `App.jsx`: App shell, mode switching, token lifecycle, and SPA layout logic.
    - `index.css` / `App.css`: Global styles and app-level styling. Rationale: Keep global CSS separate from component CSS.
    - `assets/`: Bundled assets (e.g., icons) referenced by code.
    - `components/`: UI modules grouped by feature.
      - `OAuthLogin.jsx` + `.css`: Auth launcher; redirects to `/api/auth/*`. Rationale: Self-contained auth UI.
      - `ReportingFlow.jsx` + `.css`: Multi-step reporting UX (what/where/when/etc.). Rationale: Encapsulates flow state.
      - `UserProfile.jsx` + `.css`: Profile viewer/editor; lists user reports. Rationale: Feature-isolated modal.
      - `Screens.jsx`: Step components for the reporting flow. Rationale: Decompose large flow into testable pieces.
      - `UIComponents.jsx`: Reusable primitives (buttons, inputs, progress bars, etc.). Rationale: DRY, consistent UI.
  - `obj/`: VS integration artifacts (generated). Rationale: Keep IDE-generated files out of `src/`.

### Docs and tooling folders/files
- **Purpose**: Operational support, debugging, and onboarding.
- **Why**: Keeping dev guides and debug scripts alongside code shortens feedback loops.
- Includes:
  - `FIDDLER_SETUP_GUIDE.md`, `setup_fiddler_debugging.ps1`, `hideandseek_fiddler_rules.js`, `test_fiddler_debug.html`: HTTP proxying and traffic inspection setup.
  - `USER_STORAGE_DEBUG_GUIDE.md`, `test_user_storage.ps1`: Storage and permissions debugging helpers.

## Backend: `HideandSeek.Server/`
- **`HideandSeek.Server.csproj`**: Project definition (targets, dependencies, build).
- **`Program.cs`**: ASP.NET Core bootstrap; DI registration, middleware, routing, app start.
- **`appsettings.json`**: App configuration (e.g., connection strings, auth, logging).
- **`HideandSeek.Server.http`**: REST client scratch file for testing API endpoints from the IDE.
- **`CHANGELOG.md`**: Changes/history for the server project.
- **`bin/`**: Build outputs (per configuration/target); generated by builds.
- **`obj/`**: Intermediate build artifacts; generated by builds.

### Configuration
- **`Properties/launchSettings.json`**: Local debug profiles (Kestrel/IIS Express, env vars, ports).

### Models (`HideandSeek.Server/Models/`)
- **`NoiseReport.cs`**: Domain model for a noise report (who/where/when/details).
- **`MapBounds.cs`**: Geographic bounding box for filtering reports on a map.
- **`User.cs`**: Server-side user model (identity/profile/claims).
- **`WeatherForecast.cs`**: Template/sample model kept for test endpoints.

### Services (`HideandSeek.Server/Services/`)
- **`OAuthService.cs`**: Handles OAuth flows (exchange auth code, fetch user info).
- **`JwtService.cs`**: Issues and validates JWTs used by the client to authenticate API calls.
- **`UserService.cs`**: User CRUD and profile management (backed by storage).
- **`TableStorageService.cs`**: Data access abstraction for Azure Table Storage (or similar).

### Controllers (`HideandSeek.Server/Controllers/`)
- **`OAuthController.cs`**: Endpoints for OAuth login/callback/token exchange.
- **`UsersController.cs`**: Endpoints for user profile retrieval/update.
- **`NoiseReportsController.cs`**: Endpoints for creating/querying noise reports (with bounds support).
- **`WeatherForecastController.cs`**: Sample controller for sanity checks/template.

## Frontend: `hideandseek.client/`
- **`hideandseek.client.esproj`**: Visual Studio project wrapper for the Vite app.
- **`package.json`**: Frontend dependencies and scripts (`dev`, `build`, `preview`).
- **`package-lock.json`**: Locked dependency versions.
- **`vite.config.js`**: Vite dev/build configuration (proxy, base path, plugins).
- **`index.html`**: App host page (root `div`, meta, script imports).
- **`eslint.config.js`**: ESLint configuration for code quality.
- **`README.md`**: Client-specific docs.
- **`CHANGELOG.md`**: Changes/history for the client.
- **`obj/`**: IDE/build intermediates for the JS project (from VS integration).

### Public assets (`hideandseek.client/public/`)
- **`logo.png`**: App logo served statically.
- **`vite.svg`**: Vite branding asset from the template.

### Source (`hideandseek.client/src/`)
- **`main.jsx`**: React entry; mounts the app to `index.html`, sets up providers.
- **`App.jsx`**: Top-level React component; routes or composes primary screens.
- **`App.css`**: Global styles associated with `App.jsx`.
- **`index.css`**: Base/global CSS (resets, variables, typography).
- **`assets/react.svg`**: React logo asset (template/demo).

### Components (`hideandseek.client/src/components/`)
- **`UIComponents.jsx`**: Reusable UI building blocks (buttons, inputs, modals, etc.).
- **`ReportingFlow.jsx`**: Multi-step UI to submit a noise report (form, validation, submit).
- **`ReportingFlow.css`**: Styles for the reporting flow.
- **`OAuthLogin.jsx`**: OAuth login button/flow UI (redirects, status, error handling).
- **`OAuthLogin.css`**: Styles for OAuth login components.
- **`UserProfile.jsx`**: View/edit user profile; fetch/update via API.
- **`UserProfile.css`**: Styles for profile screens.
- **`Screens.jsx`**: Page-level containers/screens composing the above components.

---

## How pieces fit together
- **Auth**: `OAuthLogin.jsx` triggers OAuth → server `OAuthController` + `OAuthService` exchange tokens → `JwtService` returns a client JWT → client stores it and uses it for API calls.
- **Reports**: `ReportingFlow.jsx` posts to `NoiseReportsController` using the JWT; server persists via `TableStorageService` using the `NoiseReport` model.
- **Users**: `UserProfile.jsx` interacts with `UsersController`/`UserService` using the JWT to get/update profile data.
- **Config**: `appsettings.json` and `vite.config.js` wire API base/proxy and keys; `launchSettings.json` defines dev ports.

---

## API endpoints and usage

### `NoiseReportsController` (base: `/api/noisereports`)
- **GET `/api/noisereports`**: Query reports in bounds.
  - Query params: `minLat`, `maxLat`, `minLon`, `maxLon`, optional `zipCodes` (comma-separated), optional `since` (ISO date).
  - Returns: `{ reports: NoiseReportDto[], totalCount: number }`.
- **POST `/api/noisereports`**: Create a noise report.
  - Body: `NoiseReport` fields (e.g., `latitude`, `longitude`, `description`, `noiseType`, `noiseLevel`, optional `address`).
  - Optional query: `username` to set `submittedBy` and award points.
  - Returns: created `NoiseReport` with `partitionKey` (ZIP), generated `rowKey`, timestamps.
- **GET `/api/noisereports/zipcodes`**: Get ZIP codes intersecting bounds (demo grid-based; replace with real geocoding in prod).
  - Query params: `minLat`, `maxLat`, `minLon`, `maxLon`.
  - Returns: `string[]` ZIP codes.

### `OAuthController` (base: `/api/auth`)
- **GET `/api/auth/google|facebook|microsoft`**: Redirects to provider OAuth consent.
  - `google` supports `forceAccountSelection=true` to prompt account picker.
- **GET `/api/auth/{provider}/callback`**: Handles OAuth callback, exchanges code for tokens, upserts user, issues JWT, then redirects to the client with `?token=...&provider=...`.
- **POST `/api/auth/validate`**: Validates a JWT and echoes user claims.
- **POST `/api/auth/logout`**: Revokes provider tokens (best-effort) and clears stored OAuth tokens for the user.
- **GET `/api/auth/logout-urls`**: Returns provider logout URLs for client to open in a new window.
- Debug endpoints:
  - **GET `/api/auth/debug/user/{provider}/{providerId}`**: Check if a user exists.
  - **GET `/api/auth/debug/test-persistence`**: Create, lookup, and delete a test user (verifies persistence).

### `UsersController` (base: `/api/users`)
- **GET `/api/users/{userId}/profile`**: Get profile without sensitive fields.
- **GET `/api/users/{userId}/reports`**: List reports submitted by user.
- **DELETE `/api/users/{userId}/reports/{reportId}`**: Delete a user’s report (and deduct points).
- **PUT `/api/users/{userId}/profile`**: Update profile fields (e.g., `displayName`, `profilePictureUrl`, `timezone`, `customUsername`). Returns sanitized user.
- Debug: **GET `/api/users/debug/all`**: List all users (sanitized) for admin/debug.

---

## Models and data meaning

### `NoiseReport`
- **PartitionKey**: ZIP code of the incident. Used to partition data geographically for efficient queries.
- **RowKey**: `yyyyMMddHHmmssfff_GUID` for unique, chronologically sortable IDs per partition.
- **Latitude/Longitude**: Required coordinates for mapping and filtering.
- **Description / NoiseType / NoiseLevel(1–10)**: Report details; level drives marker color in the UI.
- **Address**: Optional human-readable address.
- **ReportDate**: UTC timestamp when created.
- **SubmittedBy**: User ID who submitted the report.
- **PointsAwarded**: Points earned for this submission (default 10).

### `MapBounds`, `NoiseReportRequest`, `NoiseReportResponse`, `NoiseReportDto`
- **MapBounds**: `Min/MaxLatitude`, `Min/MaxLongitude`, and a list of `ZipCodes` used to query partitions.
- **NoiseReportRequest**: Request wrapper with `Bounds` and optional `Since` filter.
- **NoiseReportResponse**: `{ Reports: NoiseReportDto[], TotalCount }`.
- **NoiseReportDto**: Minimal fields sent to the client (id, coords, description, type, level, date, address, zip).

### `User`
- **PartitionKey**: Always `Users`.
- **RowKey**: `provider_providerId` (e.g., `google_123...`) – primary user ID used in APIs.
- **OAuth fields**: `OAuthProvider`, `OAuthProviderId`, `OAuthAccessToken`, `OAuthRefreshToken`, `OAuthTokenExpiresAt`.
- **Profile fields**: `DisplayName`, `Email`, `ProfilePictureUrl`, `CustomUsername`, `Timezone`.
- **Meta**: `Points`, `CreatedDate`, `LastLoginDate`, `IsActive`.

---

## Services and responsibilities

### `TableStorageService`
- Uses Azure Tables via `Azure.Data.Tables` for `NoiseReport` CRUD.
- Query strategy: iterate per ZIP partition, then filter by exact bounds and optional `since` date.
- ZIP derivation: demo function `GetZipCodeFromCoordinatesAsync` (replace with real reverse geocoding in prod).

### `UserService`
- Manages `User` entities and cross-links to `NoiseReport` for queries by `SubmittedBy`.
- Award/deduct points, last-login updates, delete user with cascading report deletes.

### `OAuthService`
- Builds provider auth URLs and validates provider access tokens to obtain profile info.
- Providers: Google (userinfo), Facebook (Graph API), Microsoft (Graph `me`).

### `JwtService`
- Issues JWT containing standard claims (name identifier, name, email) and custom claims (`provider`, `provider_id`, `custom_username`).
- Validates tokens using `JwtSettings` from configuration.

---

## Frontend integration and which endpoints are called

### `OAuthLogin.jsx`
- Redirects to `/api/auth/google|facebook|microsoft`.
- Optional Google account picker via `/api/auth/google?forceAccountSelection=true`.

### `App.jsx`
- On page load, detects `?token` from OAuth callback and calls `POST /api/auth/validate`.
- Stores JWT in `localStorage` and uses it for authenticated actions.
- Logout calls `POST /api/auth/logout` then opens provider logout URL from `GET /api/auth/logout-urls`.

### Map mode in `App.jsx` (function `MapInterface`)
- Fetch bounds ZIPs via `GET /api/noisereports/zipcodes`.
- Fetch reports via `GET /api/noisereports` with bounds + `zipCodes`.
- Submit report via `POST /api/noisereports` with body and `Authorization: Bearer <JWT>`; also sets `submittedBy` to the user ID.

### `UserProfile.jsx`
- Load profile via `GET /api/users/{userId}/profile`.
- Load user’s reports via `GET /api/users/{userId}/reports`.
- Delete a report via `DELETE /api/users/{userId}/reports/{reportId}`.
- Update profile via `PUT /api/users/{userId}/profile` (e.g., `displayName`, `timezone`).

### `ReportingFlow.jsx` and `Screens.jsx`
- Orchestrate the multi-step UI; report submission in map mode uses the endpoints above. These components manage client-side state for category, location, time, recurrence, media, and review.

---

## Configuration highlights

### `HideandSeek.Server/appsettings.json`
- **ConnectionStrings.AzureTableStorage**: Used by `UserService` and server startup to connect to Azure Tables and initialize `Users` and `NoiseReports` tables.
- **AzureStorage.ConnectionString/TableName**: Used by `TableStorageService` for `NoiseReports` data access.
- **OAuth.<Provider>**: `ClientId`, `ClientSecret`, `RedirectUri` used by `OAuthService` and callback flows.
- **JwtSettings**: `SecretKey`, `Issuer`, `Audience`, `ExpirationHours` for `JwtService` token creation and validation.

### `hideandseek.client/vite.config.js`
- Proxies `^/api` (and `/weatherforecast`) to the backend at `http://localhost:5264` during `vite` dev.
- Dev server runs on port `50696` over HTTP, aligning with OAuth callback redirects.

### `Program.cs`
- Registers controllers, Swagger (in dev), CORS `AllowAll`, DI for `UserService`, `TableStorageService`, `OAuthService`, `JwtService`.
- Initializes `Users` and `NoiseReports` tables on startup if a storage connection is configured.
- Serves the SPA: static files and `MapFallbackToFile("/index.html")` for client-side routing.


