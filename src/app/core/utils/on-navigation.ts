import { DestroyRef, inject, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event as RouterEvent, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Calls `callback` whenever a router event of the given type occurs.
 * Automatically unsubscribes when the component is destroyed.
 *
 * Must be called inside an injection context (e.g. a constructor).
 *
 * @example
 * onNavigation(NavigationEnd, () => scrollToTop());
 */
export function onNavigation<T extends RouterEvent>(
  eventType: Type<T>,
  callback: (event: T) => void,
): void {
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);
  router.events
    .pipe(
      filter((e): e is T => e instanceof eventType),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(callback);
}
