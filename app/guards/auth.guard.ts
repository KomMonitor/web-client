import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "services/auth-service/auth.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const dataExchangeService = inject(DataExchangeService);
  const router = inject(Router);

  if (dataExchangeService.enableKeycloakSecurity) {
    if (authService.Auth?.keycloak?.authenticated) {
      return true;
    }
    authService.Auth.keycloak.login();
    return false;
  }

  if (dataExchangeService.adminIsLoggedIn) {
    return true;
  }

  return router.createUrlTree(["/"]);
};
