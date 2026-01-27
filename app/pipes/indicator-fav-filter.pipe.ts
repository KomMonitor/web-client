import { Pipe, PipeTransform } from '@angular/core';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';
import { KommonitorDataSetupComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorDataSetup/kommonitor-data-setup.component';

@Pipe({
    name: 'indicatorFavFilter',
    pure: false,
    standalone: true
})
export class IndicatorFavFilter implements PipeTransform {

  constructor(
    private dataSetupComponent: KommonitorDataSetupComponent
  ) {}
  transform(topics:IndicatorsTopicsHierarchy[]): any {
    if (!topics) {
        return topics;
    }

    // filter for items in favList
    topics = topics.filter(e => this.dataSetupComponent.favTabShowTopic(e));

    // filter topics without indicators or wms
    topics = topics.filter(elem => (elem.indicatorCount>0 || elem.wmsCount>0));

    // order by name
    topics = topics.sort(function(a,b){ return a.topicName.localeCompare(b.topicName); });

    return topics;
  }
}