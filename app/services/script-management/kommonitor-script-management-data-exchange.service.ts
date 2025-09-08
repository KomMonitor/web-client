import { Injectable, Inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KommonitorScriptManagementDataExchangeService {

  constructor(
    @Inject('kommonitorDataExchangeService') private angularJsDataExchangeService: any
  ) {}

  // expose scripts list
  get availableProcessScripts(): any[] {
    const arr = this.angularJsDataExchangeService?.availableProcessScripts || [];
    try { console.debug('[ScriptMgmtExchange] availableProcessScripts length:', Array.isArray(arr) ? arr.length : 0); } catch {}
    return arr;
  }

  // roles passthrough
  get currentKeycloakLoginRoles(): string[] {
    return this.angularJsDataExchangeService?.currentKeycloakLoginRoles || [];
  }

  // metadata fetching
  async fetchIndicatorScriptsMetadata(keycloakRolesArray: string[]): Promise<any> {
    try {
      console.debug('[ScriptMgmtExchange] fetchIndicatorScriptsMetadata called with roles:', keycloakRolesArray);
      const res = await this.angularJsDataExchangeService?.fetchIndicatorScriptsMetadata?.(keycloakRolesArray);
      try { console.debug('[ScriptMgmtExchange] fetchIndicatorScriptsMetadata resolved. Now have length:', (this.availableProcessScripts || []).length); } catch {}
      return res;
    } catch (e) {
      console.error('[ScriptMgmtExchange] fetchIndicatorScriptsMetadata failed:', e);
      throw e;
    }
  }

  // CRUD local cache operations (delegated)
  addSingleProcessScriptMetadata(scriptMetadata: any): void {
    this.angularJsDataExchangeService?.addSingleProcessScriptMetadata?.(scriptMetadata);
  }

  replaceSingleProcessScriptMetadata(scriptMetadata: any): void {
    this.angularJsDataExchangeService?.replaceSingleProcessScriptMetadata?.(scriptMetadata);
  }

  deleteSingleProcessScriptMetadata(scriptId: string): void {
    this.angularJsDataExchangeService?.deleteSingleProcessScriptMetadata?.(scriptId);
  }

  getProcessScriptMetadataById(scriptId: string): any {
    return this.angularJsDataExchangeService?.getProcessScriptMetadataById?.(scriptId);
  }

  // permissions
  checkCreatePermission(): boolean {
    try { return !!this.angularJsDataExchangeService?.checkCreatePermission?.(); } catch { return false; }
  }

  checkDeletePermission(): boolean {
    try { return !!this.angularJsDataExchangeService?.checkDeletePermission?.(); } catch { return false; }
  }
}


