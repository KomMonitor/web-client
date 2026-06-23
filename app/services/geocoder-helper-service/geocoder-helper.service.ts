import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeocoderHelperService {
  private http = inject(HttpClient);

  self = this;
  targetUrlToGeocoderInstance = '';

  constructor() {
    this.targetUrlToGeocoderInstance = window.__env.targetUrlToGeocoderService;
    // extract 'nominatim/' from the URL
    this.targetUrlToGeocoderInstance = this.targetUrlToGeocoderInstance.split('nominatim')[0];
  }

  async geocodeCSVRows(dataRows, cityProperty, postcodeProperty, streetProperty) {
    const queryStrings: any = [];

    for (const dataRow of dataRows) {
      let queryString = '';

      if (dataRow[streetProperty]) {
        queryString += dataRow[streetProperty] + ', ';
      }
      if (dataRow[postcodeProperty]) {
        queryString += dataRow[postcodeProperty] + ', ';
      }
      if (dataRow[cityProperty]) {
        queryString += dataRow[cityProperty] + ', ';
      }

      if (queryString != '') {
        queryStrings.push(queryString);
      }
    }

    return await this.postBatchGeocoding_queryString(queryStrings);
  }

  filterGeocoderBatchResult(featuresArray) {
    // filter out results with category = building|amenity
    // identify best match for multiple results
    // so result will have max 1 point for each input point
    // but can have 0 points, if no match occurred

    // let acceptedCategories = ["building", "amenity"];
    const resultFeaturesArray: any = [];
    const highAccuracyValue = 2;
    const lowAccuracyValue = 1;

    for (const featuresEntry of featuresArray) {
      // let featureCandidates = featuresEntry.features.filter(entry => acceptedCategories.includes(entry.properties.category));
      const singleResultArray: any = [];

      let featureCandidates: any = featuresEntry.features.filter(
        (entry) => entry.properties.geocoderank == highAccuracyValue
      );

      if (featureCandidates.length == 0) {
        featureCandidates = featuresEntry.features.filter(
          (entry) => entry.properties.geocoderank == lowAccuracyValue
        );
      }
      // take first entry
      singleResultArray.push(featureCandidates[0]);

      resultFeaturesArray.push(singleResultArray);
    }

    return resultFeaturesArray;
  }

  async postBatchGeocoding_queryString(queryStrings) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const url = this.targetUrlToGeocoderInstance + 'geocoder/geocode/query-string/batch';

    this.http.post(url, queryStrings, { headers: headers }).subscribe({
      next: (response) => {
        const featuresArray_filtered = this.filterGeocoderBatchResult(response);
        return featuresArray_filtered;
      },
      error: (_error) => {
        console.error('Error while posting geocoding batch request');
      },
    });
  }
}
