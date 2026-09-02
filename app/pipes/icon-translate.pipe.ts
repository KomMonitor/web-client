import { Pipe, PipeTransform, inject } from '@angular/core';
import { IconTranslateService } from 'services/icon-translate/icon-translate.service';

/**
 * Turns a Bootstrap-3 glyphicon name from the API (`poiSymbolBootstrap3Name`,
 * which is optional in the contract) into a ready-to-use Font Awesome class.
 */
@Pipe({
  name: 'iconTranslate',
  standalone: true,
})
export class IconTranslate implements PipeTransform {
  private translateService = inject(IconTranslateService);

  transform(glyphicon: string | undefined | null): string {
    return `fas fa-${this.translateService.translate(glyphicon)}`;
  }
}
