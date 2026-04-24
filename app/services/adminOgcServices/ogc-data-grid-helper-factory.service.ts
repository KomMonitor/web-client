import { EnvironmentInjector, Injectable, Injector } from '@angular/core';
import { OgcDataGridHelperService } from './ogc-data-grid-helper.service';

@Injectable({ providedIn: 'root' })
export class OgcDataGridHelperServiceFactory {
  
  constructor(private parentInjector: EnvironmentInjector) {}

  create(): OgcDataGridHelperService {
    const childInjector = Injector.create({
      providers: [{ provide: OgcDataGridHelperService, useClass: OgcDataGridHelperService }],
      parent: this.parentInjector
    });

    return childInjector.get(OgcDataGridHelperService);
  }
}
