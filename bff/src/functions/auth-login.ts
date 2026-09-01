import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../lib/pkce.js';
import { sealPkce, pkceCookie, sanitizeReturnUrl } from '../lib/session.js';
import { buildAuthorizationUrl } from '../lib/keycloak.js';
import { handlePreflight } from '../lib/cors.js';

/**
 * Startet den Authorization-Code-Flow mit PKCE. Wird per echter
 * Browser-Navigation aufgerufen, nie per fetch()/XHR -- deshalb bewusst kein
 * CSRF-Check hier: eine Navigation schickt nie den X-Requested-With-Header,
 * den checkCsrf() verlangt.
 */
async function authLogin(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const returnUrl = sanitizeReturnUrl(request.query.get('returnUrl'));
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const sealed = await sealPkce({ codeVerifier, state, returnUrl });

  return {
    status: 302,
    headers: {
      Location: buildAuthorizationUrl(codeChallenge, state),
    },
    cookies: [pkceCookie(sealed)],
  };
}

app.http('auth-login', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: authLogin,
});
