import * as Iron from '@hapi/iron';
import type { Cookie } from '@azure/functions';

const SESSION_SECRET = process.env.SESSION_SECRET!;
const ACCESS_COOKIE_NAME = '__session';
const REFRESH_COOKIE_NAME = '__session_rt';
const PKCE_COOKIE_NAME = '__pkce';

// Cookies dürfen nur dann `secure` sein, wenn die App tatsächlich über HTTPS
// läuft. In der lokalen Entwicklung (http://localhost:4200) verwirft der
// Browser sonst jeden Set-Cookie-Header stillschweigend -- kein Fehler,
// einfach kein Cookie im Jar. In Produktion (ALLOWED_ORIGIN = https://...)
// muss secure hingegen true sein.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '';
const IS_SECURE = ALLOWED_ORIGIN.startsWith('https://');

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

// Auf zwei Cookies aufgeteilt: ein einzelner Iron-versiegelter Blob mit allen
// drei Keycloak-Tokens (access + refresh + id) sprengt das 4096-Byte-Limit,
// das Browser pro Cookie hart durchsetzen -- der Cookie wird dann komplett
// verworfen (kein Fehler, einfach kein Set-Cookie im Jar). accessToken +
// expiresAt werden bei JEDEM proxied Request gebraucht (Hot Path, klein
// halten); refreshToken + idToken nur beim Refresh bzw. Logout (Cold Path).
interface AccessCookieData { accessToken: string; expiresAt: number }
interface RefreshCookieData { refreshToken: string; idToken: string }

/** Kurzlebige Daten für den laufenden Login-Flow: Verifier + state aus auth-login, gelesen in auth-callback. */
export interface PkceData {
  codeVerifier: string;
  state: string;
  returnUrl: string;
}

function parseNamedCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  const raw = match.substring(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// ─── Session-Cookies (Access + Refresh, getrennt) ──────────────────────────

export async function sealSession(data: SessionData): Promise<{ access: string; refresh: string }> {
  const access: AccessCookieData = { accessToken: data.accessToken, expiresAt: data.expiresAt };
  const refresh: RefreshCookieData = { refreshToken: data.refreshToken, idToken: data.idToken };
  return {
    access: await Iron.seal(access, SESSION_SECRET, Iron.defaults),
    refresh: await Iron.seal(refresh, SESSION_SECRET, Iron.defaults),
  };
}

export async function unsealSession(
  accessSealed: string | null,
  refreshSealed: string | null,
): Promise<SessionData | null> {
  if (!accessSealed || !refreshSealed) return null;
  try {
    const access = (await Iron.unseal(
      accessSealed,
      SESSION_SECRET,
      Iron.defaults,
    )) as AccessCookieData;
    const refresh = (await Iron.unseal(
      refreshSealed,
      SESSION_SECRET,
      Iron.defaults,
    )) as RefreshCookieData;
    return { ...access, ...refresh };
  } catch {
    return null;
  }
}

export function parseAccessCookie(cookieHeader: string | null): string | null {
  return parseNamedCookie(cookieHeader, ACCESS_COOKIE_NAME);
}

export function parseRefreshCookie(cookieHeader: string | null): string | null {
  return parseNamedCookie(cookieHeader, REFRESH_COOKIE_NAME);
}

export function sessionCookies(sealed: { access: string; refresh: string }): Cookie[] {
  return [
    {
      name: ACCESS_COOKIE_NAME,
      value: sealed.access,
      httpOnly: true,
      secure: IS_SECURE,
      sameSite: 'Lax',
      path: '/',
      maxAge: 86400,
    },
    {
      name: REFRESH_COOKIE_NAME,
      value: sealed.refresh,
      httpOnly: true,
      secure: IS_SECURE,
      sameSite: 'Lax',
      path: '/',
      maxAge: 86400,
    },
  ];
}

export function clearSessionCookies(): Cookie[] {
  return [ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME].map((name) => ({
    name,
    value: '',
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  }));
}

export function isSessionExpired(session: SessionData): boolean {
  return Date.now() >= session.expiresAt;
}

// ─── PKCE-Cookie (nur während des Login-Flows) ─────────────────────────────

export async function sealPkce(data: PkceData): Promise<string> {
  return Iron.seal(data, SESSION_SECRET, Iron.defaults);
}

export async function unsealPkce(cookie: string): Promise<PkceData | null> {
  try {
    return (await Iron.unseal(cookie, SESSION_SECRET, Iron.defaults)) as PkceData;
  } catch {
    return null;
  }
}

export function parsePkceCookie(cookieHeader: string | null): string | null {
  return parseNamedCookie(cookieHeader, PKCE_COOKIE_NAME);
}

export function pkceCookie(sealed: string): Cookie {
  return {
    name: PKCE_COOKIE_NAME,
    value: sealed,
    httpOnly: true,
    secure: IS_SECURE,
    // sameSite muss 'Lax' sein (nicht 'Strict'): der Cookie wird bei der
    // Top-Level-Navigation zurück von Keycloak mitgeschickt -- das ist eine
    // Cross-Site-Navigation aus Sicht des Browsers.
    sameSite: 'Lax',
    path: '/',
    maxAge: 600, // 10 Minuten -- muss den Login bei Keycloak überstehen, nicht länger
  };
}

export function clearPkceCookieObj(): Cookie {
  return {
    name: PKCE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  };
}

/** Schützt vor Open-Redirect: nur interne, relative Pfade sind ein gültiges returnUrl. */
export function sanitizeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return '/';
  }
  return returnUrl;
}
