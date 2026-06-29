import { Pipe, PipeTransform, inject } from '@angular/core';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';

@Pipe({
  name: 'geoFavItemFilter',
  pure: false,
  standalone: true,
})
export class GeoFavItemFilter implements PipeTransform {
  private favoritesService = inject(GeoresourceFavoritesService);

  transform(items: any, topic: any): any {
    if (!items) {
      return items;
    }

    // filter for items in favList
    items = items.filter((e) => this.favoritesService.FavTabShowPoi(topic, e.georesourceId));

    return items;
  }
}
