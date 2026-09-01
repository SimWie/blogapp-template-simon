import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import {
  parsePkceCookie,
  unsealPkce,
  sealSession,
  sessionCookies,
  clearPkceCookieObj,
  clearSessionCookies,
  sanitizeReturnUrl,
} from '../lib/session.js';
import { exchangeCodeForTokens } from '../lib/keycloak.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN!;

function loginRedirect(error: 'access_denied' | 'expired' | 'failed'): HttpResponseInit {
  return {
    status: 302,
    headers: { Location: `${ALLOWED_ORIGIN}/login?error=${error}` },
    cookies: [clearPkceCookieObj()],
  };
}

/**
 * Ziel des 302-Redirects von Keycloak nach dem Login. Kein CSRF-Check (echte
 * Navigation, kein X-Requested-With möglich) -- Schutz kommt stattdessen aus
 * dem state-Vergleich gegen die __pkce-Cookie.
 */
async function authCallback(request: HttpRequest): Promise<HttpResponseInit> {
  // Keycloak selbst meldet z.B. einen Abbruch durch den User als ?error=...
  if (request.query.get('error')) {
    return loginRedirect('access_denied');
  }

  const code = request.query.get('code');
  const state = request.query.get('state');

  if (!code && !state) {
    // Keycloak leitet nach dem RP-Initiated Logout auf dieselbe
    // /api/auth/callback-URL zurück (post_logout_redirect_uri, siehe
    // buildLogoutUrl in keycloak.ts) -- kein OAuth-Fehler, sondern die
    // normale Post-Logout-Landung. Sicherheitshalber auch hier die
    // Session-Cookies löschen, falls sie aus irgendeinem Grund noch da sind.
    return {
      status: 302,
      headers: { Location: ALLOWED_ORIGIN },
      cookies: clearSessionCookies(),
    };
  }

  const cookieHeader = request.headers.get('cookie');
  const sealedPkce = parsePkceCookie(cookieHeader);
  if (!sealedPkce) {
    // __pkce-Cookie fehlt: entweder abgelaufen (>10 Min.) oder Callback ohne vorherigen Login-Start.
    return loginRedirect('expired');
  }

  const pkce = await unsealPkce(sealedPkce);
  if (!pkce || !code || !state || state !== pkce.state) {
    // state-Mismatch: möglicher CSRF-Versuch auf den OAuth-Redirect selbst.
    return loginRedirect('access_denied');
  }

  try {
    const tokens = await exchangeCodeForTokens(code, pkce.codeVerifier);
    const sealed = await sealSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    return {
      status: 302,
      headers: { Location: `${ALLOWED_ORIGIN}${sanitizeReturnUrl(pkce.returnUrl)}` },
      cookies: [...sessionCookies(sealed), clearPkceCookieObj()],
    };
  } catch (error) {
    console.error('Token-Tausch im Callback fehlgeschlagen:', error);
    return loginRedirect('failed');
  }
}

app.http('auth-callback', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/callback',
  handler: authCallback,
});
