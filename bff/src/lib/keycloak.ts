const KEYCLOAK_URL = process.env.KEYCLOAK_URL!;
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID!;
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET!;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN!;

function authorizationEndpoint(): string {
  return `${KEYCLOAK_URL}/protocol/openid-connect/auth`;
}

function tokenEndpoint(): string {
  return `${KEYCLOAK_URL}/protocol/openid-connect/token`;
}

function revokeEndpoint(): string {
  return `${KEYCLOAK_URL}/protocol/openid-connect/revoke`;
}

function endSessionEndpoint(): string {
  return `${KEYCLOAK_URL}/protocol/openid-connect/logout`;
}

/**
 * redirect_uri wird bewusst aus ALLOWED_ORIGIN gebaut, nicht aus dem
 * eingehenden Request -- muss exakt der in Keycloak registrierten Redirect-URI
 * entsprechen (z.B. http://localhost:4200/api/auth/callback -- dank
 * proxy.conf.json dieselbe Origin wie das Frontend, nicht die BFF-eigene).
 */
function redirectUri(): string {
  return `${ALLOWED_ORIGIN}/api/auth/callback`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

/** Baut die Keycloak-Login-URL für den 302-Redirect aus auth-login. */
export function buildAuthorizationUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: 'openid profile email offline_access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${authorizationEndpoint()}?${params.toString()}`;
}

/** Tauscht den Authorization Code serverseitig gegen Tokens -- mit Client Secret UND code_verifier. */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: redirectUri(),
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error_description || 'Token exchange failed');
  }

  return res.json() as Promise<TokenResponse>;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error('Token refresh failed');
  }

  return res.json() as Promise<TokenResponse>;
}

/**
 * RP-Initiated Logout bei Keycloak. id_token_hint ist nötig, damit Keycloak
 * die Weiterleitung auf post_logout_redirect_uri ohne Rückfrage akzeptiert --
 * ohne sie bleibt Keycloaks eigene SSO-Session bestehen, auch wenn unsere
 * Session-Cookie längst gelöscht ist.
 *
 * post_logout_redirect_uri ist bewusst dieselbe wie redirectUri() (die
 * /api/auth/callback-URL): Keycloak prüft sie gegen die "Valid Redirect
 * URIs" des Clients, und nur diese URL ist dort registriert -- eine
 * separate bare-Origin-URL würde mit "Invalid redirect uri" abgelehnt.
 * auth-callback.ts erkennt den Rücksprung ohne code/state und behandelt
 * ihn als normale Post-Logout-Landung, nicht als OAuth-Fehler.
 */
export function buildLogoutUrl(idToken: string): string {
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: redirectUri(),
  });
  return `${endSessionEndpoint()}?${params.toString()}`;
}

export async function revokeToken(refreshToken: string): Promise<void> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });

  await fetch(revokeEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}
