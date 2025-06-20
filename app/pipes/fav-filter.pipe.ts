import { Pipe, PipeTransform } from '@angular/core';
import { KommonitorDataSetupComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorDataSetup/kommonitor-data-setup.component';

@Pipe({
    name: 'favFilter',
    pure: false
})
export class FavFilter implements PipeTransform {

  constructor(
    private dataSetupComponent: KommonitorDataSetupComponent
  ) {}
  transform(topics:any,favItems: any): any {
    if (!topics) {
        return topics;
    }

    // filter for items in favList
    topics = topics.filter(e => this.dataSetupComponent.favTabShowTopic(e));

    // filter topics without indicators
    topics = topics.filter(elem => elem.indicatorCount>0);

    // order by name
    topics = topics.sort(function(a,b){ return a.topicName.localeCompare(b.topicName); });

    return topics;
  }
}