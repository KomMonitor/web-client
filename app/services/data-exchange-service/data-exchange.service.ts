import { Inject, Injectable } from '@angular/core';

export interface DataExchange {
  customGreetingsContact_mail: string;
  customGreetingsContact_name: string;
  customGreetingsContact_organisation: string;
  customGreetingsTextInfoMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataExchangeService {

  pipedData:DataExchange;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeServiceeProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorDataExchangeServiceeProvider;
  }

}
