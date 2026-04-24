import { Injectable } from "@angular/core";

import { AuthService } from "services/auth-service/auth.service";
import { KeycloakHelperService } from "services/keycloak-helper-service/keycloak-helper.service";

@Injectable({
  providedIn: "root",
})
export class StartupService {
  constructor(
    private authService: AuthService,
    private keycloakHelperService: KeycloakHelperService,
  ) {}

  async initApp(): Promise<void> {
    console.log("start loading required config files");
    await this.loadAllConfigs();
    await this.authService.initKeycloak();

    if(this.authService.isAuthenticated())
      this.keycloakHelperService.init();
  }

  private async loadAllConfigs(): Promise<void> {
    const response = await fetch("./config/config-storage-server.json");
    const configStorageServerConfig = await response.json();
    window.__env = window.__env || {};
    window.__env.configStorageServerConfig = configStorageServerConfig;

    console.log("dynamically load env.js");
    await Promise.allSettled([
      this.loadAppConfigScript(
        configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      ),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
        "keycloakConfig",
      ),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
        "controlsConfig",
      ),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig,
        "filterConfig",
      ),
    ]);

    console.log("all configs have been loaded");
    this.initEnvVariables();
  }

  private async fetchJsonConfig(url: string, envKey: string): Promise<void> {
    try {
      const response = await fetch(url);
      window.__env[envKey] = await response.json();
      console.log(`${envKey} config file fetched`);
    } catch {
      console.log(
        `Could not fetch ${envKey} from server. Using local backup defaults.`,
      );
    }
  }

  private loadAppConfigScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        console.log("env.js loaded");
        resolve();
      };
      script.onerror = () => {
        console.log(
          "Error while loading app config from client config storage server. Will use defaults instead.",
        );
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  private initEnvVariables(): void {
    if (!window.__env?.enableDebug) {
      window.console.log = function () {};
    }
  }
}
