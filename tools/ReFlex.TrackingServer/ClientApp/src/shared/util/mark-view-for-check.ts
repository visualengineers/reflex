import { ChangeDetectorRef } from '@angular/core';
import { MonoTypeOperatorFunction, tap } from 'rxjs';

/**
 * Schedule (never force) a render for imperative subscription callbacks.
 * The subscriber updates its fields/nested models before Angular runs the check.
 */
export function markViewForCheck<T>(view: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
  return tap({
    next: () => view.markForCheck(),
    error: () => view.markForCheck()
  });
}
