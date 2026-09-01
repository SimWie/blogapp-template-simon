import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Setzt Credentials + CSRF-Header zentral für jeden Request an die BFF-URL,
 * statt das in jedem einzelnen Aufruf zu wiederholen.
 */
export const bffInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.bffUrl)) {
    req = req.clone({
      withCredentials: true,
      setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  }
  return next(req);
};
