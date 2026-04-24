import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { UserFavourites } from 'components/ngComponents/models/favorites.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root'
})
export class FavService {

  private baseUrlToKomMonitorDataAPI  = this.envConfigService.apiUrl + this.envConfigService.basePath;
  userInfoExists = false;
  userInfoId = undefined;

  constructor(
    private http: HttpClient,
    private envConfigService: EnvConfigService,
  ) {
  }

  bodyTemplate: UserFavourites = {
    georesourceFavourites: [],
    indicatorFavourites: [],
    georesourceTopicFavourites: [],
    indicatorTopicFavourites: [],
    webServiceFavourites: []
  };
  favObject:UserFavourites = this.bodyTemplate;

  prepBody(favorites, fullBody = false) {
    
    //assign items
    Object.keys(this.bodyTemplate).forEach((key) => {
      if(favorites[key] !== undefined)
        this.favObject[key] = favorites[key];
    });
  }

  handleFavSelection(favorites) {
    this.prepBody(favorites, !this.userInfoExists);
  }

  getUserInfo() {
    return this.favObject;
  }

  storeFavSelection() {

    var body:any = this.favObject;
    delete(body.userInfoId);
    delete(body.keycloakId);
    
    if(this.userInfoExists===true) {
      let url = `${this.baseUrlToKomMonitorDataAPI}/userInfos/${this.userInfoId}`;

      this.http.put(url, body).subscribe({
        next: (response:any) => {
          console.log("userInfo data patched");
          this.favObject = response;
        },
        error: error => {
          console.log("Unable to store userInfo data");
        }
      });
    } else {
      let url = `${this.baseUrlToKomMonitorDataAPI}/userInfos`;

      this.http.post(url, body).subscribe({
        next: (response:any) => {
          this.userInfoExists = true;
          this.userInfoId = response.userInfoId;
          this.favObject = response;
          console.log("userInfo data initialized");
        },
        error: error => {
          console.log("Unable to store userInfo data");
        }
      });
    }
  }

  init(){
    console.log("Favs init");
    
    this.http.get(`${this.baseUrlToKomMonitorDataAPI}/userInfos/user`, {'responseType': 'json'}).subscribe({
      next: (response:any) => {
        if(response.userInfoId) {
          this.userInfoExists = true;
          this.userInfoId = response.userInfoId;
          this.favObject = response;
        }
      },
      error: error => {
        console.log("Unable to read userInfo data. User may not have registered himthis.");
      }
    });
  };
}
