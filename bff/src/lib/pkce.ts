import { randomBytes, createHash } from 'node:crypto';

/**
 * PKCE-Helper (RFC 7636) für den Authorization-Code-Flow. Node's crypto
 * reicht dafür aus -- keine zusätzliche Dependency nötig.
 */

/** 32 zufällige Bytes, base64url-kodiert -- ergibt einen 43 Zeichen langen, RFC-konformen code_verifier. */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/** S256 code_challenge = base64url(sha256(code_verifier)). */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** Zufälliger state-Wert gegen CSRF auf den OAuth-Redirect selbst. */
export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
