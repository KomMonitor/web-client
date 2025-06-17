import { ajskommonitorReachabilityCoverageReportsHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityCoverageReportsHelperService {

  pipedData:any;

  constructor(
    @Inject('kommonitorReachabilityCoverageReportsHelperService') private ajskommonitorReachabilityCoverageReportsHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) { 
    this.pipedData = this.ajskommonitorReachabilityCoverageReportsHelperServiceProvider;
  }

  generateTotalCoverageReport_focusPoiCoverage(tmpActiveScenario, indicatorStatisticsEntry) {
    this.ajskommonitorReachabilityCoverageReportsHelperServiceProvider.generateTotalCoverageReport_focusPoiCoverage(tmpActiveScenario, indicatorStatisticsEntry);
  }

  generateFeatureCoverageReport_focusPoiCoverage(tmpActiveScenario, indicatorStatisticsEntry) {
    this.ajskommonitorReachabilityCoverageReportsHelperServiceProvider.generateFeatureCoverageReport_focusPoiCoverage(tmpActiveScenario, indicatorStatisticsEntry);
  }
}
