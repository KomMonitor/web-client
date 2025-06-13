import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the token from the Auth service
    const token = this.authService.Auth?.keycloak?.token;

    if (token && this.urlRequiresKeycloakAuthHeader(request.url)) {
      // Clone the request and add the authorization header
      const authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authRequest);
    }

    return next.handle(request);
  }

  private urlRequiresKeycloakAuthHeader(url: string): boolean {
    // /admin/ is used to make admin requests against keycloak
    if (url.includes("/admin/")) {
      return false;
    }
    // ORS isochrones and directions requests
    if (url.includes("isochrones")) {
      return false;
    }
    if (url.includes("routes")) {
      return false;
    }

    // for KomMonitor public requests we do not need any authentication
    if (url.includes("/public/")) {
      return false;
    }

    return true;
  }
} 