import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'baseMapFilter',
  pure: false,
  standalone: true,
})
export class BaseMapFilter implements PipeTransform {
  transform(items: any[]): any {
    if (!items) {
      return items;
    }
    return items.filter((item) => item.layerConfig.name != 'TILE_LAYER_GRAYSCALE');
  }
}
