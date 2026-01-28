import { Pipe, PipeTransform } from '@angular/core';
import { IconTranslateService } from 'services/icon-translate/icon-translate.service';

@Pipe({
    name: 'iconTranslate',
    standalone: true
})
export class IconTranslate implements PipeTransform {

  constructor(
    private translateService: IconTranslateService
  ) {}

  transform(glyphicon: string): any {

    return `fas fa-${this.translateService.translate(glyphicon)}`;
  }
}