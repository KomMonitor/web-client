import { HttpClient } from '@angular/common/http';
import { ajskommonitorFavServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FavService {

  baseUrlToKomMonitorDataAPI = window.__env.apiUrl + window.__env.basePath;
  userInfoExists = false;
  userInfoId = undefined;

  constructor(
    private http: HttpClient
  ) {}

  bodyTemplate = {
    "georesourceFavourites": [],
    "indicatorFavourites": [],
    "georesourceTopicFavourites": [],
    "indicatorTopicFavourites": []
  };
  favObject:any = this.bodyTemplate;

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

     /*  this.http.put(url, body).subscribe({
        next: response => {
          console.log("userInfo data patched");
          this.favObject = response;
        },
        error: error => {
          console.log("Unable to store userInfo data");
        }
      }); */
    } else {
      // userInfo does not exist yet, make initial post call

      let url = `${this.baseUrlToKomMonitorDataAPI}/userInfos`;

     /*  this.http.post(url, body).subscribe({
        next: (response:any) => {
          this.userInfoExists = true;
          this.userInfoId = response.userInfoId;
          this.favObject = response;
          console.log("userInfo data initialized");
        },
        error: error => {
          console.log("Unable to store userInfo data");
        }
      }); */
    }
  }

  init(){
    console.log("Favs init");
    
    this.http.get(`${this.baseUrlToKomMonitorDataAPI}/userInfos/user`, {'responseType': 'text'}).subscribe({
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
