import { inject, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs';

/**
 * Creates a read-only boolean signal that tracks whether a CSS breakpoint matches.
 * Use with Angular CDK `Breakpoints` constants (e.g. `Breakpoints.Handset`).
 *
 * Must be called inside an injection context (e.g. a field initializer or constructor).
 */
export function breakpointSignal(breakpoint: string): Signal<boolean> {
  const observer = inject(BreakpointObserver);
  return toSignal(
    observer.observe(breakpoint).pipe(
      map((result) => result.matches),
      shareReplay(),
    ),
    { initialValue: false },
  ) as Signal<boolean>;
}
