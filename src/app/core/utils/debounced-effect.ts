import { Signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';

/**
 * Calls `callback` whenever `source` signal changes, debounced by `ms` milliseconds.
 * Skips the initial value and automatically unsubscribes when the component is destroyed.
 *
 * Must be called inside an injection context (e.g. a constructor).
 */
export function debouncedEffect<T>(
  source: Signal<T>,
  callback: (value: T) => void,
  ms: number,
): void {
  toObservable(source)
    .pipe(skip(1), debounceTime(ms), distinctUntilChanged(), takeUntilDestroyed())
    .subscribe(callback);
}
