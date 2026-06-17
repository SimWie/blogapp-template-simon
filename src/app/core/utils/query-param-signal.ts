import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

/**
 * Creates a read-only signal that tracks a URL query parameter.
 * Returns `defaultValue` when the parameter is absent.
 *
 * Must be called inside an injection context (e.g. a field initializer or constructor).
 */
export function queryParamSignal(param: string, defaultValue: string): Signal<string> {
  const route = inject(ActivatedRoute);
  return toSignal(route.queryParamMap.pipe(map((params) => params.get(param) ?? defaultValue)), {
    initialValue: defaultValue,
  });
}
