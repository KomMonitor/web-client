import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "services/auth-service/auth.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { EnvConfigService } from "../services/env-config-service/env-config.service";

const ADMIN_ROLE_SUFFIXES = ["-creator", "-publisher", "-editor"] as const;

export const authAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const dataExchangeService = inject(DataExchangeService);
  const envConfigService = inject(EnvConfigService);
  const router = inject(Router);

  if (envConfigService.enableKeycloakSecurity) {
    if (authService.isAuthenticated()) {
      const tokenParsed = authService.getTokenParsed();
      if (
        tokenParsed &&
        tokenParsed.realm_access &&
        tokenParsed.realm_access.roles &&
        tokenParsed.realm_access.roles.some((role) =>
          ADMIN_ROLE_SUFFIXES.some((suffix) => role.endsWith(suffix)),
        )
      ) {
        return true;
      }
      return router.createUrlTree(["/"]);
    }
    authService.login();
    return false;
  }

  if (dataExchangeService.adminIsLoggedIn) {
    return true;
  }

  return router.createUrlTree(["/"]);
};
