import { Pipe, PipeTransform } from '@angular/core';
import { PoiComponent } from 'components/ngComponents/userInterface/sidebar/poi/poi.component';

@Pipe({
    name: 'geoFavItemFilter',
    pure: false
})
export class GeoFavItemFilter implements PipeTransform {

  constructor(
    private poiComponent: PoiComponent
  ) {}

  transform(items:any, topic: any): any {
    if (!items) {
        return items;
    }

    // filter for items in favList
    items = items.filter(e => this.poiComponent.FavTabShowPoi(topic,e.georesourceId));

    return items;
  }
}