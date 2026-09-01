import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import {
  parseAccessCookie,
  parseRefreshCookie,
  unsealSession,
  clearSessionCookies,
} from '../lib/session.js';
import { revokeToken, buildLogoutUrl } from '../lib/keycloak.js';
import { checkCsrf } from '../lib/csrf.js';
import { corsHeaders, handlePreflight } from '../lib/cors.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL!;

/**
 * Löscht die eigene Session UND liefert die Keycloak-Logout-URL zurück.
 * Ohne die zweite Hälfte bleibt Keycloaks eigene SSO-Session bestehen, auch
 * wenn unser __session-Cookie längst weg ist -- das Frontend muss dorthin
 * navigieren (window.location.href), nicht nur den lokalen State zurücksetzen.
 */
async function authLogout(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const csrfError = checkCsrf(request);
  if (csrfError) return { ...csrfError, headers: corsHeaders };

  const cookieHeader = request.headers.get('cookie');
  const accessSealed = parseAccessCookie(cookieHeader);
  const refreshSealed = parseRefreshCookie(cookieHeader);

  let logoutUrl = `${KEYCLOAK_URL}/protocol/openid-connect/logout`;

  if (accessSealed && refreshSealed) {
    const session = await unsealSession(accessSealed, refreshSealed);
    if (session) {
      logoutUrl = buildLogoutUrl(session.idToken);
      await revokeToken(session.refreshToken).catch(() => {
        /* ignore */
      });
    }
  }

  return {
    status: 200,
    jsonBody: { logoutUrl },
    headers: corsHeaders,
    cookies: clearSessionCookies(),
  };
}

app.http('auth-logout', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/logout',
  handler: authLogout,
});
