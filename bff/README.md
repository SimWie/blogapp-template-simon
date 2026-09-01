# Backend-for-Frontend (BFF) with Azure Functions

A TypeScript-based Backend-for-Frontend (BFF) layer that provides:

- **Session management** via encrypted cookies (@hapi/iron)
- **OAuth2 authentication** via Keycloak (ROPC password grant)
- **Automatic token refresh** for seamless user experience
- **CSRF protection** with X-Requested-With header validation
- **CORS handling** with proper preflight support
- **Backend proxy** with bearer token injection
- **Blog API** endpoints for entries, likes, and comments

## Architecture

```
Frontend (SPA on localhost:4200)
    ↓
BFF (Azure Functions v4 on localhost:7071)
    ├── Session: @hapi/iron encrypted cookies
    ├── Auth: Keycloak OAuth2 ROPC
    └── Proxy: Routes to backend API with token injection
```

## Environment Setup

### 1. Configure Local Development

Copy template values to `local.settings.json`:

```bash
cd bff
# Edit local.settings.json with your values:
# - KEYCLOAK_URL: Your Keycloak realm URL
# - KEYCLOAK_CLIENT_ID: BFF client ID (e.g., "bff-blogapp")
# - KEYCLOAK_CLIENT_SECRET: Client secret from Keycloak
# - SESSION_SECRET: Random 32+ char string (generate: openssl rand -base64 32)
# - BLOG_BACKEND_URL: Your backend API URL
# - ALLOWED_ORIGIN: Frontend origin (http://localhost:4200 for dev)
```

### 2. Install Dependencies

```bash
npm run setup:bff
```

### 3. Start Development

**Option A: Frontend only**

```bash
npm start        # http://localhost:4200
```

**Option B: Frontend + BFF together**

```bash
npm run start:full
# Frontend: http://localhost:4200
# BFF: http://localhost:7071/api
```

## API Endpoints

### Authentication

- `GET /api/auth/login?returnUrl=...` — Start the Authorization Code + PKCE flow → 302 to Keycloak (browser navigation, not fetch)
- `GET /api/auth/callback` — OAuth redirect target → exchanges the code for tokens, sets the session cookie, 302 to `returnUrl`
- `POST /api/auth/logout` — Logout → clear session cookie
- `GET /api/auth/me` — Check auth status → auto-refresh if expired
- `POST /api/auth/refresh` — Explicit token refresh

### Blog API (proxied to backend)

- `GET /api/entries` — List all blog entries
- `POST /api/entries` — Create new entry (requires auth)
- `GET /api/entries/{id}` — Get single entry
- `PUT /api/entries/{id}/like` — Toggle like (requires auth, CSRF check)
- `POST /api/entries/{id}/comments` — Add comment (requires auth, CSRF check)

## Frontend Integration

### HTTP Interceptor

Add to your Angular app to send credentials and CSRF header:

```typescript
export const bffInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.bffUrl)) {
    req = req.clone({
      withCredentials: true,
      setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  }
  return next(req);
};
```

### Environment Config

```typescript
// environment.development.ts
export const environment = {
  bffUrl: 'http://localhost:7071/api',
};

// environment.ts (production)
export const environment = {
  bffUrl: '/api',
};
```

## Keycloak Setup

### Create a Confidential Client

1. **Client type**: OpenID Connect
2. **Client authentication**: ON (confidential)
3. **Standard Flow (Authorization Code)**: Enabled
4. **Direct Access Grants**: OFF -- this BFF never sees a password, don't enable ROPC
5. **Valid Redirect URIs**: `{ALLOWED_ORIGIN}/api/auth/callback` for every origin you run the frontend on (e.g. `http://localhost:4200/api/auth/callback`)
6. **Scope**: Request `openid profile email offline_access`

### Client Configuration

```bash
# Get admin access token
curl -X POST https://your-keycloak/realms/master/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=ADMIN_PASSWORD"

# Create client (adjust REALM and ADMIN_TOKEN)
curl -X POST https://your-keycloak/admin/realms/REALM/clients \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": "bff-blogapp",
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "publicClient": false,
    "serviceAccountsEnabled": false,
    "redirectUris": ["http://localhost:4200/api/auth/callback"]
  }'
```

## Building & Deploying

### Build BFF

```bash
npm run build:bff
# Output: bff/dist/
```

### Deploy to Azure Static Web Apps

1. **Ensure `api_location: "bff"` in GitHub Actions workflow**
2. **Set environment variables on Azure SWA**:

```bash
az staticwebapp appsettings set \
  --name <your-swa-name> \
  --setting-names \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  KEYCLOAK_URL="https://your-keycloak/realms/your-realm" \
  KEYCLOAK_CLIENT_ID="bff-blogapp" \
  KEYCLOAK_CLIENT_SECRET="your-client-secret" \
  BLOG_BACKEND_URL="https://your-backend-api" \
  ALLOWED_ORIGIN="https://your-app.azurestaticapps.net"
```

3. **Verify settings**:

```bash
az staticwebapp appsettings list --name <your-swa-name> --query "[].name" -o tsv
```

All six variables must be present.

## Critical Pitfalls (Real-world bugs)

### ✗ Azure SWA strips Set-Cookie headers

**Problem**: Login appears successful (200 + body) but no cookie is set.

**Fix**: Use `cookies: Cookie[]` property on `HttpResponseInit`, not header manipulation.

### ✗ Azure SWA URL-encodes cookie values

**Problem**: `@hapi/iron` tokens contain `*` chars which become `%2A`, breaking unseal.

**Fix**: `session.ts` already includes `decodeURIComponent()` fallback.

### ✗ CORS headers missing on error responses

**Problem**: CSRF/auth failures return error but without CORS headers, browser blocks response.

**Fix**: Always spread `corsHeaders` into error responses.

### ✗ ESM configuration

**Problem**: `func start` fails with "Cannot find module" or import errors.

**Fix**: Ensure `"type": "module"` in `package.json` and use `.js` extensions on local imports.

### ✗ Route conflicts

**Problem**: Can't use separate functions for GET and POST on same route.

**Fix**: Handle both methods in a single function file.

### ✗ `@types/hapi__iron@^6.0.6` doesn't exist

**Problem**: npm fails to install.

**Fix**: Use `^6.0.1` (this is already set in package.json).

## Troubleshooting

| Issue                                 | Cause                                  | Fix                                        |
| ------------------------------------- | -------------------------------------- | ------------------------------------------ |
| 404 on all `/api/*` routes            | `api_location` empty in deploy         | Set `api_location: "bff"` in workflow      |
| No cookie after login                 | Headers stripped by Azure SWA          | Use `cookies: Cookie[]` on response        |
| Login works, then 401 on next request | Cookie unseal fails (URL encoding)     | `decodeURIComponent()` added in session.ts |
| CORS error on login/like              | Missing CORS headers on error response | Spread `corsHeaders` into all responses    |
| `func start` ESM errors               | Missing `"type": "module"`             | Add to bff/package.json                    |
| Preflight (OPTIONS) fails             | Missing X-Requested-With header config | Check `Access-Control-Allow-Headers`       |

## Adding New Proxy Endpoints

1. Create `bff/src/functions/proxy-<resource>.ts`
2. Handle OPTIONS preflight first
3. Check CSRF for state-changing requests (POST, PUT, DELETE)
4. Include CORS headers on ALL responses
5. Call `proxyToBackend()` with backend path
6. Register function with `app.http()` including OPTIONS
7. Import in `bff/src/index.ts`
8. Rebuild and test locally

## Testing Endpoints Locally

Login can't be curled end-to-end (Keycloak's own login page is part of the flow) -- test it in the browser instead: open `http://localhost:4200/api/auth/login?returnUrl=/`, log in at Keycloak, and confirm you land back on the app with a `__session` cookie set.

```bash
# Check auth status
curl http://localhost:7071/api/auth/me \
  -b __session=<cookie-value>

# List entries
curl http://localhost:7071/api/entries

# Logout
curl -X POST http://localhost:7071/api/auth/logout \
  -H 'X-Requested-With: XMLHttpRequest' \
  -b __session=<cookie-value>
```

## Further Reading

- [Azure Functions v4 Programming Model](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=typescript)
- [Keycloak OAuth2 Grant Types](https://www.keycloak.org/docs/latest/server_admin/index.html#_client-credentials)
- [@hapi/iron Documentation](https://github.com/hapijs/iron)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
