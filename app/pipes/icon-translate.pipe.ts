import { Pipe, PipeTransform, inject } from '@angular/core';
import { IconTranslateService } from 'services/icon-translate/icon-translate.service';

@Pipe({
  name: 'iconTranslate',
  standalone: true,
})
export class IconTranslate implements PipeTransform {
  private translateService = inject(IconTranslateService);

  transform(glyphicon: string): any {
    return `fas fa-${this.translateService.translate(glyphicon)}`;
  }
}
