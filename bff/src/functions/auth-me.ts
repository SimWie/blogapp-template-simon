import { app, Cookie, HttpRequest, HttpResponseInit } from '@azure/functions';
import {
  parseAccessCookie,
  parseRefreshCookie,
  unsealSession,
  isSessionExpired,
  sealSession,
  sessionCookies,
  clearSessionCookies,
} from '../lib/session.js';
import { refreshTokens } from '../lib/keycloak.js';
import { corsHeaders, handlePreflight } from '../lib/cors.js';
import { decodeJwt } from 'jose';

async function authMe(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const cookieHeader = request.headers.get('cookie');
  const accessSealed = parseAccessCookie(cookieHeader);
  const refreshSealed = parseRefreshCookie(cookieHeader);

  if (!accessSealed || !refreshSealed) {
    return {
      status: 200,
      jsonBody: { isAuthenticated: false, user: null },
      headers: corsHeaders,
    };
  }

  let session = await unsealSession(accessSealed, refreshSealed);
  if (!session) {
    return {
      status: 200,
      jsonBody: { isAuthenticated: false, user: null },
      headers: corsHeaders,
      cookies: clearSessionCookies(),
    };
  }

  const extraCookies: Cookie[] = [];

  if (isSessionExpired(session)) {
    try {
      const tokens = await refreshTokens(session.refreshToken);
      session = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token ?? session.idToken,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };
      const newSealed = await sealSession(session);
      extraCookies.push(...sessionCookies(newSealed));
    } catch {
      return {
        status: 200,
        jsonBody: { isAuthenticated: false, user: null },
        headers: corsHeaders,
        cookies: clearSessionCookies(),
      };
    }
  }

  const claims = decodeJwt(session.accessToken);

  return {
    status: 200,
    jsonBody: {
      isAuthenticated: true,
      user: {
        preferred_username: claims.preferred_username,
        email: claims.email,
        name: claims.name,
        roles: (claims as Record<string, unknown>).realm_access
          ? (
              (claims as Record<string, unknown>).realm_access as {
                roles: string[];
              }
            ).roles
          : [],
      },
    },
    headers: corsHeaders,
    cookies: extraCookies.length > 0 ? extraCookies : undefined,
  };
}

app.http('auth-me', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: authMe,
});
