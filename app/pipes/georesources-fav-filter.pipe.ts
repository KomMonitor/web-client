import { Pipe, PipeTransform } from '@angular/core';
import { PoiComponent } from 'components/ngComponents/userInterface/sidebar/poi/poi.component';

@Pipe({
    name: 'geoFavFilter',
    pure: false
})
export class GeoFavFilter implements PipeTransform {

  constructor(
    private poiComponent: PoiComponent
  ) {}

  transform(topics:any, favItems: any): any {
    if (!topics) {
        return topics;
    }

    // filter for items in favList
    topics = topics.filter(e => this.poiComponent.favTabShowTopic(e));

    // filter topics without indicators
    topics = topics.filter(elem => elem.totalCount>0);
    
    // order by name
    topics = topics.sort(function(a,b){ return a.topicName.localeCompare(b.topicName); });

    return topics;
  }
}