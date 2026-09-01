import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';

/**
 * Functional Guard-Factory: prüft Login-Status (immer) und optional eine
 * Rolle. inject() muss synchron vor dem ersten await passieren -- danach ist
 * der Injection-Context nicht mehr garantiert gültig.
 */
export function authGuard(requiredRole?: string): CanMatchFn {
  return async (_route, segments) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    // Wartet auf den einmaligen Session-Check aus dem AuthStore-Konstruktor,
    // statt auf loading() zu pollen.
    await authStore.ready;

    const returnUrl = '/' + segments.map((segment) => segment.path).join('/');

    if (!authStore.isAuthenticated()) {
      return router.parseUrl(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }

    if (requiredRole && !authStore.roles().includes(requiredRole)) {
      return router.parseUrl(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }

    return true;
  };
}
