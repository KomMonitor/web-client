import { Pipe, PipeTransform, inject } from '@angular/core';
import { GeoresourcesTopicsHierarchy } from 'components/ngComponents/models/georesources.models';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';

@Pipe({
  name: 'geoFavFilter',
  pure: false,
  standalone: true,
})
export class GeoFavFilter implements PipeTransform {
  private favoritesService = inject(GeoresourceFavoritesService);

  transform(topics: GeoresourcesTopicsHierarchy[]): any {
    if (!topics) {
      return topics;
    }

    // filter for items in favList
    topics = topics.filter((e) => this.favoritesService.favTabShowTopic(e));

    // filter topics without indicators
    topics = topics.filter((elem) => elem.totalCount > 0);

    // order by name
    topics = topics.sort(function (a, b) {
      return a.topicName.localeCompare(b.topicName);
    });

    return topics;
  }
}
