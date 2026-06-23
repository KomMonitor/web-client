import { EnvironmentInjector, Injectable, Injector, inject } from '@angular/core';
import { OgcDataGridHelperService } from './ogc-data-grid-helper.service';

@Injectable({ providedIn: 'root' })
export class OgcDataGridHelperServiceFactory {
  private parentInjector = inject(EnvironmentInjector);

  create(): OgcDataGridHelperService {
    const childInjector = Injector.create({
      providers: [{ provide: OgcDataGridHelperService, useClass: OgcDataGridHelperService }],
      parent: this.parentInjector,
    });

    return childInjector.get(OgcDataGridHelperService);
  }
}
