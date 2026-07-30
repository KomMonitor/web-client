import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.urlRequiresKeycloakAuthHeader(request.url)) {
      return next.handle(request);
    }

    // Refresh the token first (no-op if it is still valid long enough) so
    // long-running flows like the indicator-add wizard don't submit with an
    // already-expired access token and get a 401 back from the API.
    return from(this.authService.ensureValidToken()).pipe(
      switchMap((token) => {
        if (token) {
          request = request.clone({
            headers: request.headers.set('Authorization', `Bearer ${token}`),
          });
        }
        return next.handle(request);
      })
    );
  }

  private urlRequiresKeycloakAuthHeader(url: string): boolean {
    // /admin/ is used to make admin requests against keycloak
    if (url.includes('/admin/')) {
      return false;
    }
    // ORS isochrones and directions requests
    if (url.includes('isochrones')) {
      return false;
    }
    if (url.includes('routes')) {
      return false;
    }

    // for KomMonitor public requests we do not need any authentication
    if (url.includes('/public/')) {
      return false;
    }

    return true;
  }
}
